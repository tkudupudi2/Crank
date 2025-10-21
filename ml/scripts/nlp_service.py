#!/usr/bin/env python3
"""
Integrated NLP Service
Combines rule-based and ML-based approaches for financial query processing
"""

import json
import torch
from typing import Dict, Any, Optional
from rule_based_nlp import RuleBasedNLP, QueryResult
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import spacy

class IntegratedNLPService:
    def __init__(self, 
                 intent_model_path: str = "./ml/models/intent_classifier",
                 entity_model_path: str = "./ml/models/entity_extractor"):
        self.rule_based = RuleBasedNLP()
        self.intent_model = None
        self.intent_tokenizer = None
        self.entity_model = None
        self.use_ml = False
        
        # Try to load ML models
        try:
            self._load_ml_models(intent_model_path, entity_model_path)
            self.use_ml = True
            print("ML models loaded successfully")
        except Exception as e:
            print(f"ML models not available, using rule-based only: {e}")
    
    def _load_ml_models(self, intent_model_path: str, entity_model_path: str):
        """Load trained ML models"""
        # Load intent classification model
        self.intent_tokenizer = AutoTokenizer.from_pretrained(intent_model_path)
        self.intent_model = AutoModelForSequenceClassification.from_pretrained(intent_model_path)
        
        # Load entity extraction model
        self.entity_model = spacy.load(entity_model_path)
    
    def process_query(self, query: str, user_id: str = None) -> Dict[str, Any]:
        """Process a natural language query and return structured result"""
        # Use ML models if available, otherwise fall back to rule-based
        if self.use_ml:
            return self._process_with_ml(query, user_id)
        else:
            return self._process_with_rules(query, user_id)
    
    def _process_with_ml(self, query: str, user_id: str = None) -> Dict[str, Any]:
        """Process query using ML models"""
        # Intent classification
        intent_result = self._classify_intent_ml(query)
        
        # Entity extraction
        entities = self._extract_entities_ml(query)
        
        # Generate SQL query
        sql_query = self._generate_sql_query(intent_result["intent"], entities)
        
        # Generate response template
        response_template = self._generate_response_template(intent_result["intent"], entities)
        
        return {
            "intent": intent_result["intent"],
            "entities": entities,
            "confidence": intent_result["confidence"],
            "sql_query": sql_query,
            "response_template": response_template,
            "method": "ml"
        }
    
    def _process_with_rules(self, query: str, user_id: str = None) -> Dict[str, Any]:
        """Process query using rule-based approach"""
        result = self.rule_based.parse_query(query)
        
        return {
            "intent": result.intent,
            "entities": result.entities,
            "confidence": result.confidence,
            "sql_query": result.sql_query,
            "response_template": result.response_template,
            "method": "rule_based"
        }
    
    def _classify_intent_ml(self, query: str) -> Dict[str, Any]:
        """Classify intent using ML model"""
        # Tokenize input
        inputs = self.intent_tokenizer(
            query, 
            return_tensors="pt", 
            truncation=True, 
            padding=True, 
            max_length=128
        )
        
        # Get predictions
        with torch.no_grad():
            outputs = self.intent_model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        # Get predicted class and confidence
        predicted_class_id = torch.argmax(predictions, dim=-1).item()
        confidence = predictions[0][predicted_class_id].item()
        
        # Map class ID to intent name
        id2label = {0: "spending_analysis", 1: "savings_analysis", 2: "budget_analysis", 3: "category_breakdown"}
        intent = id2label.get(predicted_class_id, "unknown")
        
        return {
            "intent": intent,
            "confidence": confidence
        }
    
    def _extract_entities_ml(self, query: str) -> Dict[str, Any]:
        """Extract entities using ML model"""
        doc = self.entity_model(query)
        
        entities = {
            "category": None,
            "timeframe": None,
            "amount": None,
            "account": None,
            "merchant": None
        }
        
        for ent in doc.ents:
            if ent.label_ == "CATEGORY":
                entities["category"] = ent.text.lower()
            elif ent.label_ == "TIME":
                entities["timeframe"] = ent.text.lower()
            elif ent.label_ == "AMOUNT":
                try:
                    entities["amount"] = float(ent.text.replace("$", "").replace("dollars", "").strip())
                except:
                    entities["amount"] = None
            elif ent.label_ == "ACCOUNT":
                entities["account"] = ent.text.lower()
            elif ent.label_ == "MERCHANT":
                entities["merchant"] = ent.text.title()
        
        return entities
    
    def _generate_sql_query(self, intent: str, entities: Dict[str, Any]) -> str:
        """Generate SQL query based on intent and entities"""
        return self.rule_based._generate_sql_query(intent, entities)
    
    def _generate_response_template(self, intent: str, entities: Dict[str, Any]) -> str:
        """Generate response template based on intent and entities"""
        return self.rule_based._generate_response_template(intent, entities)
    
    def get_supported_intents(self) -> list:
        """Get list of supported intents"""
        return ["spending_analysis", "savings_analysis", "budget_analysis", "category_breakdown"]
    
    def get_entity_types(self) -> list:
        """Get list of supported entity types"""
        return ["category", "timeframe", "amount", "account", "merchant"]

# Test the integrated service
if __name__ == "__main__":
    service = IntegratedNLPService()
    
    test_queries = [
        "How much did I spend on dining last month?",
        "What did I save this month?",
        "How much do I have left in my food budget?",
        "Show me my entertainment spending this week",
        "What's my grocery breakdown last month?"
    ]
    
    print("Testing Integrated NLP Service:")
    print("=" * 50)
    
    for query in test_queries:
        result = service.process_query(query)
        print(f"\nQuery: {query}")
        print(f"Intent: {result['intent']} (confidence: {result['confidence']:.2f})")
        print(f"Entities: {result['entities']}")
        print(f"Method: {result['method']}")
        print(f"SQL: {result['sql_query']}")
        print(f"Response: {result['response_template']}")
