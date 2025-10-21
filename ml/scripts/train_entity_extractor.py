#!/usr/bin/env python3
"""
Entity Extraction Model Training
Trains a spaCy-based NER model for financial entity extraction
"""

import spacy
from spacy.tokens import DocBin
from spacy.util import filter_spans
import json
import jsonlines
from typing import List, Dict, Any, Tuple
import random

class EntityExtractorTrainer:
    def __init__(self):
        self.nlp = spacy.blank("en")  # Start with blank English model
        self.entity_types = [
            "TIME", "CATEGORY", "ACCOUNT", "AMOUNT", "MERCHANT"
        ]
        
    def load_training_data(self, filepath: str) -> List[Dict[str, Any]]:
        """Load training data from JSONL file"""
        data = []
        with jsonlines.open(filepath) as reader:
            for obj in reader:
                data.append(obj)
        return data
    
    def create_training_data(self, data: List[Dict[str, Any]]) -> List[Tuple[str, Dict[str, List[Tuple[int, int, str]]]]]:
        """Create training data in spaCy format"""
        training_data = []
        
        for item in data:
            query = item["query"]
            entities = item["entities"]
            
            # Create entity annotations
            entity_annotations = []
            
            # Add category entity
            if entities.get("category"):
                category = entities["category"]
                if category in query.lower():
                    start = query.lower().find(category)
                    end = start + len(category)
                    entity_annotations.append((start, end, "CATEGORY"))
            
            # Add timeframe entity
            if entities.get("timeframe"):
                timeframe = entities["timeframe"]
                if timeframe in query.lower():
                    start = query.lower().find(timeframe)
                    end = start + len(timeframe)
                    entity_annotations.append((start, end, "TIME"))
            
            # Add amount entity
            if entities.get("amount"):
                amount = str(entities["amount"])
                if amount in query:
                    start = query.find(amount)
                    end = start + len(amount)
                    entity_annotations.append((start, end, "AMOUNT"))
            
            # Add account entity
            if entities.get("account"):
                account = entities["account"]
                if account in query.lower():
                    start = query.lower().find(account)
                    end = start + len(account)
                    entity_annotations.append((start, end, "ACCOUNT"))
            
            # Add merchant entity
            if entities.get("merchant"):
                merchant = entities["merchant"]
                if merchant.lower() in query.lower():
                    start = query.lower().find(merchant.lower())
                    end = start + len(merchant)
                    entity_annotations.append((start, end, "MERCHANT"))
            
            # Add pattern-based entity detection
            entity_annotations.extend(self._extract_pattern_entities(query))
            
            training_data.append((query, {"entities": entity_annotations}))
        
        return training_data
    
    def _extract_pattern_entities(self, query: str) -> List[Tuple[int, int, str]]:
        """Extract entities using pattern matching"""
        entities = []
        
        # Time patterns
        time_patterns = [
            (r"last month", "TIME"),
            (r"this month", "TIME"),
            (r"last week", "TIME"),
            (r"this week", "TIME"),
            (r"past \d+ days", "TIME"),
            (r"this year", "TIME"),
            (r"last year", "TIME")
        ]
        
        for pattern, entity_type in time_patterns:
            import re
            matches = re.finditer(pattern, query, re.IGNORECASE)
            for match in matches:
                entities.append((match.start(), match.end(), entity_type))
        
        # Amount patterns
        amount_patterns = [
            (r"\$\d+(?:\.\d{2})?", "AMOUNT"),
            (r"\d+(?:\.\d{2})?\s*dollars?", "AMOUNT")
        ]
        
        for pattern, entity_type in amount_patterns:
            import re
            matches = re.finditer(pattern, query, re.IGNORECASE)
            for match in matches:
                entities.append((match.start(), match.end(), entity_type))
        
        return entities
    
    def create_spacy_training_data(self, training_data: List[Tuple[str, Dict[str, List[Tuple[int, int, str]]]]):
        """Create spaCy training data format"""
        db = DocBin()
        
        for text, annotations in training_data:
            doc = self.nlp.make_doc(text)
            ents = []
            
            for start, end, label in annotations["entities"]:
                span = doc.char_span(start, end, label=label)
                if span is not None:
                    ents.append(span)
            
            # Filter overlapping entities
            ents = filter_spans(ents)
            doc.ents = ents
            
            db.add(doc)
        
        return db
    
    def train_ner_model(self, training_data: List[Tuple[str, Dict[str, List[Tuple[int, int, str]]]]]):
        """Train the NER model"""
        # Create spaCy training data
        db = self.create_spacy_training_data(training_data)
        
        # Save training data
        db.to_disk("./ml/data/processed/training_data.spacy")
        
        # Create NER pipeline
        if "ner" not in self.nlp.pipe_names:
            ner = self.nlp.add_pipe("ner", last=True)
        else:
            ner = self.nlp.get_pipe("ner")
        
        # Add entity labels
        for entity_type in self.entity_types:
            ner.add_label(entity_type)
        
        # Training configuration
        config = {
            "paths": {
                "train": "./ml/data/processed/training_data.spacy",
                "dev": "./ml/data/processed/training_data.spacy"
            },
            "corpora": {
                "train": {"@readers": "spacy.Corpus.v0", "path": "./ml/data/processed/training_data.spacy"},
                "dev": {"@readers": "spacy.Corpus.v0", "path": "./ml/data/processed/training_data.spacy"}
            },
            "initialize": {
                "vectors": "en_core_web_sm",
                "init_tok2vec": "en_core_web_sm"
            },
            "nlp": {
                "lang": "en"
            },
            "components": {
                "ner": {
                    "factory": "ner",
                    "moves": None,
                    "update_with_or": True,
                    "model": {
                        "@architectures": "spacy.TransitionBasedParser.v2",
                        "state_type": "ner",
                        "extra_state_tokens": False,
                        "hidden_width": 128,
                        "maxout_pieces": 3,
                        "use_upper": True,
                        "n_steps": 0,
                        "dropout": 0.1,
                        "hidden_depth": 1
                    }
                }
            },
            "training": {
                "dev_corpus": "corpora.dev",
                "train_corpus": "corpora.train",
                "optimizer": {
                    "@optimizers": "Adam.v1"
                },
                "batches": {
                    "@batches": "spacy.batch_by_words.v2",
                    "size": 1000,
                    "tolerance": 0.2
                },
                "max_epochs": 10,
                "eval_frequency": 200,
                "patience": 1600,
                "max_grad_norm": 1.0,
                "use_beam": 1
            }
        }
        
        # Save config
        import json
        with open("./ml/models/entity_extractor/config.json", "w") as f:
            json.dump(config, f, indent=2)
        
        print("Training data prepared. Run 'spacy train' command to train the model.")
        print("Command: spacy train ./ml/models/entity_extractor/config.json ./ml/models/entity_extractor --paths.train ./ml/data/processed/training_data.spacy --paths.dev ./ml/data/processed/training_data.spacy")
    
    def load_trained_model(self, model_path: str):
        """Load a trained NER model"""
        self.nlp = spacy.load(model_path)
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract entities from text using trained model"""
        doc = self.nlp(text)
        
        entities = {
            "TIME": [],
            "CATEGORY": [],
            "ACCOUNT": [],
            "AMOUNT": [],
            "MERCHANT": []
        }
        
        for ent in doc.ents:
            if ent.label_ in entities:
                entities[ent.label_].append(ent.text)
        
        return entities

def main():
    """Main training function"""
    # Initialize trainer
    trainer = EntityExtractorTrainer()
    
    # Load training data
    print("Loading training data...")
    data = trainer.load_training_data("ml/data/training/training_data.jsonl")
    print(f"Loaded {len(data)} training examples")
    
    # Create training data
    print("Creating training data...")
    training_data = trainer.create_training_data(data)
    print(f"Created {len(training_data)} training examples")
    
    # Train the model
    print("Training NER model...")
    trainer.train_ner_model(training_data)
    print("Training data prepared!")
    
    # Test with sample queries
    print("\nTesting entity extraction...")
    test_queries = [
        "How much did I spend on dining last month?",
        "What did I save this month?",
        "Show me my entertainment spending this week"
    ]
    
    for query in test_queries:
        entities = trainer.extract_entities(query)
        print(f"\nQuery: {query}")
        print(f"Entities: {entities}")

if __name__ == "__main__":
    main()
