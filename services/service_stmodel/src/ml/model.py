"""
Modèle LSTM simple pour prédiction qualité eau
"""
import torch
import torch.nn as nn


class WaterQualityLSTM(nn.Module):
    """Modèle LSTM simple - même architecture que l'entraînement"""
    
    def __init__(self, input_size=11, hidden_size=64, num_layers=2):
        super(WaterQualityLSTM, self).__init__()
        
        # LSTM pour séquences temporelles
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2
        )
        
        # Couche finale
        self.fc = nn.Linear(hidden_size, 1)
    
    def forward(self, x):
        """
        Forward pass
        x: (batch, 14, 11) - 14 jours avec 11 features
        """
        lstm_out, (hidden, cell) = self.lstm(x)
        last_output = lstm_out[:, -1, :]
        prediction = self.fc(last_output)
        return prediction
