#!/usr/bin/env python3
"""
Enhanced Intent Classifier Training Script
Uses the training data to build a robust ML-based classifier
"""

import json
import jsonlines
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline
import joblib
import os
from typing import List, Dict, Any

class IntentClassifierTrainer:
    def __init__(self, data_path: str = "data/training/training_data.jsonl"):
        self.data_path = data_path
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 3),
            stop_words='english',
            lowercase=True
        )
        self.classifier = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        self.pipeline = Pipeline([
            ('vectorizer', self.vectorizer),
            ('classifier', self.classifier)
        ])
        
    def load_training_data(self) -> List[Dict[str, Any]]:
        """Load training data from JSONL file"""
        data = []
        with jsonlines.open(self.data_path) as reader:
            for obj in reader:
                data.append(obj)
        return data
    
    def prepare_data(self, data: List[Dict[str, Any]]) -> tuple:
        """Prepare features and labels for training"""
        queries = []
        intents = []
        
        for item in data:
            queries.append(item['query'])
            intents.append(item['intent'])
            
            # Add variations to training data
            for variation in item.get('variations', []):
                queries.append(variation)
                intents.append(item['intent'])
        
        return queries, intents
    
    def train(self) -> Dict[str, Any]:
        """Train the intent classifier"""
        print("Loading training data...")
        data = self.load_training_data()
        
        print(f"Loaded {len(data)} training examples")
        
        print("Preparing data...")
        queries, intents = self.prepare_data(data)
        
        print(f"Total training samples: {len(queries)}")
        print(f"Unique intents: {set(intents)}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            queries, intents, test_size=0.2, random_state=42, stratify=intents
        )
        
        print("Training classifier...")
        self.pipeline.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.pipeline.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\nAccuracy: {accuracy:.3f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        # Test on some examples
        test_queries = [
            "How much did I spend on dining last month?",
            "What's my utilities expense this month?",
            "Show me my entertainment spending",
            "What did I save this month?",
            "How much do I have left in my food budget?",
            "Tell me a joke"
        ]
        
        print("\nTesting on sample queries:")
        for query in test_queries:
            prediction = self.pipeline.predict([query])[0]
            confidence = max(self.pipeline.predict_proba([query])[0])
            print(f"'{query}' -> {prediction} (confidence: {confidence:.3f})")
        
        return {
            'accuracy': accuracy,
            'test_size': len(X_test),
            'train_size': len(X_train),
            'intents': list(set(intents))
        }
    
    def save_model(self, model_path: str = "models/intent_classifier.pkl"):
        """Save the trained model"""
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump(self.pipeline, model_path)
        print(f"Model saved to {model_path}")
    
    def load_model(self, model_path: str = "models/intent_classifier.pkl"):
        """Load a trained model"""
        self.pipeline = joblib.load(model_path)
        print(f"Model loaded from {model_path}")

def main():
    trainer = IntentClassifierTrainer()
    
    print("=== Intent Classifier Training ===")
    results = trainer.train()
    
    print(f"\nTraining completed!")
    print(f"Accuracy: {results['accuracy']:.3f}")
    print(f"Training samples: {results['train_size']}")
    print(f"Test samples: {results['test_size']}")
    print(f"Intents: {results['intents']}")
    
    # Save the model
    trainer.save_model()
    
    print("\n=== Model Testing ===")
    # Test the saved model
    trainer2 = IntentClassifierTrainer()
    trainer2.load_model()
    
    test_queries = [
        "What's my dining expense this month?",
        "Show me my shopping costs last week",
        "How much did I pay for entertainment?",
        "What did I save last month?",
        "Display my utilities expenses",
        "What's my credit score?"  # Should be unknown
    ]
    
    print("\nTesting loaded model:")
    for query in test_queries:
        prediction = trainer2.pipeline.predict([query])[0]
        confidence = max(trainer2.pipeline.predict_proba([query])[0])
        print(f"'{query}' -> {prediction} (confidence: {confidence:.3f})")

if __name__ == "__main__":
    main()
