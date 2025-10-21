#!/usr/bin/env python3
"""
Intent Classification Model Training
Trains a BERT-based model for financial query intent classification
"""

import json
import torch
import pandas as pd
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification,
    TrainingArguments, 
    Trainer,
    DataCollatorWithPadding
)
from datasets import Dataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import numpy as np
import jsonlines
from typing import List, Dict, Any

class IntentClassifierTrainer:
    def __init__(self, model_name: str = "distilbert-base-uncased"):
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = None
        self.label2id = {
            "spending_analysis": 0,
            "savings_analysis": 1,
            "budget_analysis": 2,
            "category_breakdown": 3
        }
        self.id2label = {v: k for k, v in self.label2id.items()}
        
    def load_training_data(self, filepath: str) -> List[Dict[str, Any]]:
        """Load training data from JSONL file"""
        data = []
        with jsonlines.open(filepath) as reader:
            for obj in reader:
                data.append(obj)
        return data
    
    def prepare_dataset(self, data: List[Dict[str, Any]]) -> Dataset:
        """Prepare dataset for training"""
        texts = []
        labels = []
        
        for item in data:
            texts.append(item["query"])
            labels.append(self.label2id[item["intent"]])
            
            # Add variations to training data
            for variation in item.get("variations", []):
                texts.append(variation)
                labels.append(self.label2id[item["intent"]])
        
        # Create dataset
        dataset = Dataset.from_dict({
            "text": texts,
            "labels": labels
        })
        
        return dataset
    
    def tokenize_function(self, examples):
        """Tokenize the examples"""
        return self.tokenizer(
            examples["text"], 
            truncation=True, 
            padding=True, 
            max_length=128
        )
    
    def compute_metrics(self, eval_pred):
        """Compute evaluation metrics"""
        predictions, labels = eval_pred
        predictions = np.argmax(predictions, axis=1)
        
        precision, recall, f1, _ = precision_recall_fscore_support(
            labels, predictions, average='weighted'
        )
        accuracy = accuracy_score(labels, predictions)
        
        return {
            'accuracy': accuracy,
            'f1': f1,
            'precision': precision,
            'recall': recall
        }
    
    def train(self, train_dataset: Dataset, eval_dataset: Dataset = None):
        """Train the intent classification model"""
        # Tokenize datasets
        train_dataset = train_dataset.map(self.tokenize_function, batched=True)
        if eval_dataset:
            eval_dataset = eval_dataset.map(self.tokenize_function, batched=True)
        
        # Initialize model
        self.model = AutoModelForSequenceClassification.from_pretrained(
            self.model_name,
            num_labels=len(self.label2id),
            id2label=self.id2label,
            label2id=self.label2id
        )
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir="./ml/models/intent_classifier",
            num_train_epochs=3,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=16,
            warmup_steps=500,
            weight_decay=0.01,
            logging_dir="./ml/models/intent_classifier/logs",
            logging_steps=10,
            evaluation_strategy="steps" if eval_dataset else "no",
            eval_steps=100 if eval_dataset else None,
            save_strategy="steps",
            save_steps=100,
            load_best_model_at_end=True if eval_dataset else False,
            metric_for_best_model="f1" if eval_dataset else None,
        )
        
        # Data collator
        data_collator = DataCollatorWithPadding(tokenizer=self.tokenizer)
        
        # Create trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            tokenizer=self.tokenizer,
            data_collator=data_collator,
            compute_metrics=self.compute_metrics,
        )
        
        # Train the model
        trainer.train()
        
        # Save the model
        trainer.save_model()
        self.tokenizer.save_pretrained("./ml/models/intent_classifier")
        
        return trainer
    
    def predict(self, text: str) -> Dict[str, Any]:
        """Predict intent for a given text"""
        if self.model is None:
            raise ValueError("Model not trained yet. Call train() first.")
        
        # Tokenize input
        inputs = self.tokenizer(
            text, 
            return_tensors="pt", 
            truncation=True, 
            padding=True, 
            max_length=128
        )
        
        # Get predictions
        with torch.no_grad():
            outputs = self.model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        # Get predicted class and confidence
        predicted_class_id = torch.argmax(predictions, dim=-1).item()
        confidence = predictions[0][predicted_class_id].item()
        
        return {
            "intent": self.id2label[predicted_class_id],
            "confidence": confidence,
            "all_scores": {
                self.id2label[i]: predictions[0][i].item() 
                for i in range(len(self.id2label))
            }
        }

def main():
    """Main training function"""
    # Initialize trainer
    trainer = IntentClassifierTrainer()
    
    # Load training data
    print("Loading training data...")
    data = trainer.load_training_data("ml/data/training/training_data.jsonl")
    print(f"Loaded {len(data)} training examples")
    
    # Prepare dataset
    print("Preparing dataset...")
    dataset = trainer.prepare_dataset(data)
    print(f"Prepared {len(dataset)} examples")
    
    # Split into train/eval
    train_size = int(0.8 * len(dataset))
    eval_size = len(dataset) - train_size
    
    train_dataset = dataset.select(range(train_size))
    eval_dataset = dataset.select(range(train_size, train_size + eval_size))
    
    print(f"Train set: {len(train_dataset)} examples")
    print(f"Eval set: {len(eval_dataset)} examples")
    
    # Train the model
    print("Training model...")
    trainer.train(train_dataset, eval_dataset)
    print("Training completed!")
    
    # Test the model
    print("\nTesting model...")
    test_queries = [
        "How much did I spend on dining last month?",
        "What did I save this month?",
        "How much do I have left in my food budget?",
        "Show me my entertainment spending this week"
    ]
    
    for query in test_queries:
        result = trainer.predict(query)
        print(f"\nQuery: {query}")
        print(f"Predicted Intent: {result['intent']} (confidence: {result['confidence']:.3f})")
        print(f"All Scores: {result['all_scores']}")

if __name__ == "__main__":
    main()
