"""
Service to fetch and aggregate data from Capteurs and Satellite services
for automatic predictions
"""
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import asyncio

# Service URLs (Docker internal network)
CAPTEURS_URL = "http://service_capteurs:8000"
SATELLITE_URL = "http://service_satellite:8000"

# Timeout for HTTP requests
TIMEOUT = 30.0


class DataFetcher:
    """Fetches and aggregates sensor + satellite data for predictions"""
    
    def __init__(self):
        self.capteurs_url = CAPTEURS_URL
        self.satellite_url = SATELLITE_URL
    
    async def fetch_capteurs_data(self, hours: int = 336, limit: int = 100) -> Dict:
        """
        Fetch sensor data from Capteurs service
        
        Args:
            hours: Period in hours (default 336 = 14 days)
            limit: Max number of records
        
        Returns:
            Dict with capteurs data
        """
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                response = await client.get(
                    f"{self.capteurs_url}/api/capteurs/data/latest",
                    params={"hours": hours, "limit": limit}
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            print(f"❌ Error fetching capteurs data: {e}")
            return {"success": False, "error": str(e), "capteurs": []}
        except Exception as e:
            print(f"❌ Unexpected error fetching capteurs: {e}")
            return {"success": False, "error": str(e), "capteurs": []}
    
    async def fetch_satellite_indices(self, hours: int = 336, limit: int = 100) -> Dict:
        """
        Fetch satellite indices from Satellite service
        
        Args:
            hours: Period in hours (default 336 = 14 days)
            limit: Max number of records
        
        Returns:
            Dict with satellite indices
        """
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                response = await client.get(
                    f"{self.satellite_url}/api/satellite/indices/latest",
                    params={"hours": hours, "limit": limit}
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            print(f"❌ Error fetching satellite data: {e}")
            return {"success": False, "error": str(e), "indices": []}
        except Exception as e:
            print(f"❌ Unexpected error fetching satellite: {e}")
            return {"success": False, "error": str(e), "indices": []}
    
    async def fetch_all_data(self, hours: int = 336) -> Dict:
        """
        Fetch both capteurs and satellite data in parallel
        
        Args:
            hours: Period in hours
        
        Returns:
            Dict with both datasets
        """
        capteurs_task = self.fetch_capteurs_data(hours)
        satellite_task = self.fetch_satellite_indices(hours)
        
        capteurs_data, satellite_data = await asyncio.gather(
            capteurs_task, satellite_task
        )
        
        return {
            "capteurs": capteurs_data,
            "satellite": satellite_data,
            "fetch_timestamp": datetime.now().isoformat()
        }
    
    def aggregate_measurements(
        self,
        capteurs_data: Dict,
        satellite_data: Dict,
        station_id: int,
        latitude: float,
        longitude: float,
        days: int = 14
    ) -> List[Dict]:
        """
        Aggregate sensor and satellite data into 14-day measurement format
        required by the prediction model.
        
        Args:
            capteurs_data: Data from capteurs service
            satellite_data: Data from satellite service
            station_id: Station/sensor ID
            latitude: Zone latitude
            longitude: Zone longitude
            days: Number of days (default 14)
        
        Returns:
            List of 14 MeasurementInput dicts
        """
        measurements = []
        
        # Get capteurs list
        capteurs_list = capteurs_data.get("capteurs", [])
        indices_list = satellite_data.get("indices", [])
        
        # Create date range (last 14 days)
        end_date = datetime.now()
        
        for i in range(days):
            day_offset = days - 1 - i  # Start from oldest
            target_date = end_date - timedelta(days=day_offset)
            date_str = target_date.strftime("%Y-%m-%d")
            
            # Find closest capteur data for this day
            capteur_data = self._find_closest_data(
                capteurs_list, target_date, "timestamp"
            )
            
            # Find closest satellite data for this day
            satellite_entry = self._find_closest_data(
                indices_list, target_date, "timestamp"
            )
            
            # Extract values with defaults
            mesures = capteur_data.get("mesures", {}) if capteur_data else {}
            indices = satellite_entry.get("indices", {}) if satellite_entry else {}
            
            # Calculate days_diff (difference between capteur and satellite dates)
            days_diff = 0.0
            if capteur_data and satellite_entry:
                try:
                    cap_ts = datetime.fromisoformat(capteur_data.get("timestamp", date_str).replace("Z", ""))
                    sat_ts = datetime.fromisoformat(satellite_entry.get("timestamp", date_str).replace("Z", ""))
                    days_diff = abs((cap_ts - sat_ts).total_seconds() / 86400)
                except:
                    days_diff = 0.0
            
            measurement = {
                "date_capteur": date_str,
                "date_satellite": date_str,
                "days_diff": days_diff,
                "station_id": station_id,
                "latitude": latitude,
                "longitude": longitude,
                # Capteur measurements (with realistic defaults if missing)
                "pH": mesures.get("ph", 7.5),
                "oxygene_dissous": mesures.get("oxygene", 8.0),
                "COD": mesures.get("cod", 15.0),  # Chemical Oxygen Demand
                "CODMn": mesures.get("codmn", 5.0),  # COD Manganese
                "NH4N": mesures.get("nh4n", 0.5),  # Ammonium Nitrogen
                "TPH": mesures.get("tph", 0.1),  # Total Petroleum Hydrocarbons
                "DIP": mesures.get("dip", 0.05),  # Dissolved Inorganic Phosphorus
                "DIN": mesures.get("din", 0.5),  # Dissolved Inorganic Nitrogen
                # Satellite indices (with defaults)
                "NDWI": indices.get("ndwi", 0.3),
                "chlorophyll_index": indices.get("chlorophyll", 0.2),
                "turbidity_index": indices.get("turbidity", 0.15)
            }
            
            measurements.append(measurement)
        
        return measurements
    
    def _find_closest_data(
        self,
        data_list: List[Dict],
        target_date: datetime,
        timestamp_field: str
    ) -> Optional[Dict]:
        """
        Find the data entry closest to target date
        
        Args:
            data_list: List of data entries
            target_date: Target datetime
            timestamp_field: Name of timestamp field
        
        Returns:
            Closest data entry or None
        """
        if not data_list:
            return None
        
        closest = None
        min_diff = float('inf')
        
        for entry in data_list:
            try:
                ts_str = entry.get(timestamp_field, "")
                if isinstance(ts_str, str):
                    entry_date = datetime.fromisoformat(ts_str.replace("Z", ""))
                else:
                    entry_date = ts_str
                
                diff = abs((entry_date - target_date).total_seconds())
                if diff < min_diff:
                    min_diff = diff
                    closest = entry
            except:
                continue
        
        return closest
    
    def generate_sample_measurements(
        self,
        station_id: int = 1,
        latitude: float = 33.5,
        longitude: float = -7.5,
        quality: str = "good"
    ) -> List[Dict]:
        """
        Generate sample measurements for testing when real data is unavailable.
        
        Args:
            station_id: Station ID
            latitude: Latitude
            longitude: Longitude
            quality: "good", "medium", or "bad" - affects generated values
        
        Returns:
            List of 14 sample measurements
        """
        import random
        
        measurements = []
        end_date = datetime.now()
        
        # Quality presets
        presets = {
            "good": {"pH": (7.0, 8.0), "oxygene": (7.0, 10.0), "cod": (5, 15), "ndwi": (0.3, 0.5)},
            "medium": {"pH": (6.5, 8.5), "oxygene": (5.0, 8.0), "cod": (15, 30), "ndwi": (0.2, 0.4)},
            "bad": {"pH": (5.5, 9.0), "oxygene": (2.0, 5.0), "cod": (30, 60), "ndwi": (0.0, 0.2)}
        }
        
        preset = presets.get(quality, presets["medium"])
        
        for i in range(14):
            day_offset = 13 - i
            target_date = end_date - timedelta(days=day_offset)
            date_str = target_date.strftime("%Y-%m-%d")
            
            measurement = {
                "date_capteur": date_str,
                "date_satellite": date_str,
                "days_diff": random.uniform(0, 2),
                "station_id": station_id,
                "latitude": latitude,
                "longitude": longitude,
                "pH": random.uniform(*preset["pH"]),
                "oxygene_dissous": random.uniform(*preset["oxygene"]),
                "COD": random.uniform(*preset["cod"]),
                "CODMn": random.uniform(2, 10),
                "NH4N": random.uniform(0.1, 1.0),
                "TPH": random.uniform(0.01, 0.5),
                "DIP": random.uniform(0.01, 0.1),
                "DIN": random.uniform(0.1, 1.0),
                "NDWI": random.uniform(*preset["ndwi"]),
                "chlorophyll_index": random.uniform(0.1, 0.4),
                "turbidity_index": random.uniform(0.1, 0.3)
            }
            
            measurements.append(measurement)
        
        return measurements


# Global instance
data_fetcher = DataFetcher()
