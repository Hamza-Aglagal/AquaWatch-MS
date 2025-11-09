"""Service de traitement d'images satellites - Calcul des indices environnementaux"""
import numpy as np
from typing import Optional, Dict


class ImageProcessor:
    """
    Processeur d'images satellites pour calculer les indices de qualité d'eau
    
    Indices supportés:
    - NDWI: Normalized Difference Water Index
    - Chlorophylle: Estimation via ratio NIR/Red
    - Turbidité: Estimation via bande rouge
    """
    @staticmethod
    def calculate_ndwi(nir_band: np.ndarray, green_band: np.ndarray) -> float:
        """
        Calculer l'indice NDWI (Normalized Difference Water Index)
        
        Formule: NDWI = (Green - NIR) / (Green + NIR)
        
        Interprétation:
        - NDWI > 0: Eau probable
        - NDWI < 0: Sol/végétation
        
        Args:
            nir_band: Bande proche infrarouge (B08)
            green_band: Bande verte (B03)
        
        Returns:
            Valeur NDWI moyenne sur l'image
        """
        numerator = green_band - nir_band
        denominator = green_band + nir_band
        ndwi = np.mean(numerator / (denominator + 1e-10))
        return float(ndwi)
    
    @staticmethod
    def calculate_chlorophyll(red_band: np.ndarray, nir_band: np.ndarray) -> float:
        """
        Estimer la concentration de chlorophylle-a
        
        Algorithme simplifié basé sur le ratio NIR/Red
        Pour algorithmes avancés, voir: OC3, OC4, etc.
        
        Args:
            red_band: Bande rouge (B04)
            nir_band: Bande proche infrarouge (B08)
        
        Returns:
            Estimation chlorophylle en mg/m³
        """
        ratio = nir_band / (red_band + 1e-10)
        chlorophyll = np.mean(ratio) * 0.5  # Facteur de conversion
        return float(chlorophyll)
    
    @staticmethod
    def calculate_turbidity(red_band: np.ndarray) -> float:
        """
        Estimer la turbidité de l'eau
        
        Méthode simplifiée basée sur la réflectance de la bande rouge
        Corrélation positive entre turbidité et réflectance rouge
        
        Args:
            red_band: Bande rouge (B04)
        
        Returns:
            Estimation turbidité en NTU (Nephelometric Turbidity Units)
        """
        turbidity = np.mean(red_band) * 100
        return float(turbidity)
    
    @staticmethod
    def process_sentinel_image(image_data: np.ndarray) -> Optional[Dict]:
        """Traiter image Sentinel-2 et calculer tous les indices"""
        try:
            # Extraire bandes (B02=Blue, B03=Green, B04=Red, B08=NIR)
            blue = image_data[:, :, 0]
            green = image_data[:, :, 1]
            red = image_data[:, :, 2]
            nir = image_data[:, :, 3]
            
            indices = {
                "ndwi": ImageProcessor.calculate_ndwi(nir, green),
                "chlorophylle": ImageProcessor.calculate_chlorophyll(red, nir),
                "turbidite_satellite": ImageProcessor.calculate_turbidity(red),
                "temperature_surface": None  # Nécessite bande thermique
            }
            
            return indices
        except Exception as e:
            print(f"❌ Erreur traitement: {e}")
            return None