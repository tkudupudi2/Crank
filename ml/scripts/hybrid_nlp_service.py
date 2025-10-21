#!/usr/bin/env python3
"""
Hybrid NLP Service
Combines rule-based and ML-based approaches for better accuracy
"""

import json
import joblib
import os
from typing import Dict, Any, List, Optional
from rule_based_nlp import RuleBasedNLP

class HybridNLPService:
    def __init__(self, model_path: str = "models/intent_classifier.pkl"):
        self.rule_based_nlp = RuleBasedNLP()
        self.ml_model = None
        self.model_path = model_path
        
        # Load ML model if available
        if os.path.exists(model_path):
            try:
                self.ml_model = joblib.load(model_path)
                print(f"ML model loaded from {model_path}")
            except Exception as e:
                print(f"Failed to load ML model: {e}")
                self.ml_model = None
        else:
            print(f"ML model not found at {model_path}, using rule-based only")
    
    def process_query(self, query: str, user_id: str = None) -> Dict[str, Any]:
        """
        Process a natural language query using hybrid approach
        """
        print(f"Processing query: '{query}' for user: {user_id}")
        
        # Get rule-based result
        rule_result = self.rule_based_nlp.parse_query(query)
        
        # Get ML result if available
        ml_result = None
        if self.ml_model:
            try:
                ml_intent = self.ml_model.predict([query])[0]
                ml_confidence = max(self.ml_model.predict_proba([query])[0])
                ml_result = {
                    'intent': ml_intent,
                    'confidence': ml_confidence
                }
            except Exception as e:
                print(f"ML prediction failed: {e}")
                ml_result = None
        
        # Combine results using hybrid approach
        final_result = self._combine_results(rule_result, ml_result, query)
        
        return final_result
    
    def _combine_results(self, rule_result: Dict[str, Any], ml_result: Optional[Dict[str, Any]], query: str) -> Dict[str, Any]:
        """
        Combine rule-based and ML results intelligently
        """
        # If ML model is not available, use rule-based
        if not ml_result:
            return {
                "intent": rule_result.intent,
                "entities": rule_result.entities,
                "confidence": rule_result.confidence,
                "sql": rule_result.sql_query,
                "response": rule_result.response_template,
                "method": "rule_based"
            }
        
        # If rule-based is unknown, use ML
        if rule_result.intent == 'unknown':
            return {
                "intent": ml_result['intent'],
                "entities": rule_result.entities,  # Still use rule-based entities
                "confidence": ml_result['confidence'],
                "sql": self._generate_sql_for_intent(ml_result['intent'], rule_result.entities),
                "response": self._generate_response_for_intent(ml_result['intent'], rule_result.entities),
                "method": "ml_based"
            }
        
        # If both agree, use rule-based (more reliable for entities)
        if rule_result.intent == ml_result['intent']:
            return {
                "intent": rule_result.intent,
                "entities": rule_result.entities,
                "confidence": max(rule_result.confidence, ml_result['confidence']),
                "sql": rule_result.sql_query,
                "response": rule_result.response_template,
                "method": "hybrid_agreed"
            }
        
        # If they disagree, use the one with higher confidence
        if rule_result.confidence > ml_result['confidence']:
            return {
                "intent": rule_result.intent,
                "entities": rule_result.entities,
                "confidence": rule_result.confidence,
                "sql": rule_result.sql_query,
                "response": rule_result.response_template,
                "method": "hybrid_rule_won"
            }
        else:
            return {
                "intent": ml_result['intent'],
                "entities": rule_result.entities,  # Still use rule-based entities
                "confidence": ml_result['confidence'],
                "sql": self._generate_sql_for_intent(ml_result['intent'], rule_result.entities),
                "response": self._generate_response_for_intent(ml_result['intent'], rule_result.entities),
                "method": "hybrid_ml_won"
            }
    
    def _generate_sql_for_intent(self, intent: str, entities: Dict[str, Any]) -> str:
        """Generate SQL query for ML-determined intent"""
        if intent == 'spending_analysis':
            return self.rule_based_nlp._generate_spending_sql(entities)
        elif intent == 'savings_analysis':
            return self.rule_based_nlp._generate_savings_sql(entities)
        elif intent == 'budget_analysis':
            return self.rule_based_nlp._generate_budget_sql(entities)
        elif intent == 'category_breakdown':
            return self.rule_based_nlp._generate_category_sql(entities)
        else:
            return 'SELECT 1'
    
    def _generate_response_for_intent(self, intent: str, entities: Dict[str, Any]) -> str:
        """Generate response template for ML-determined intent"""
        return self.rule_based_nlp._generate_response_template(intent, entities)

def main():
    """Test the hybrid NLP service"""
    service = HybridNLPService()
    
    test_queries = [
        "How much did I spend on dining last month?",
        "What's my utilities expense this month?",
        "Show me my entertainment spending",
        "What did I save this month?",
        "How much do I have left in my food budget?",
        "What's my credit score?",
        "Tell me a joke",
        "Display my shopping costs last week",
        "How much did I pay for entertainment?",
        "What's my dining expense this month?"
    ]
    
    print("Testing Hybrid NLP Service:")
    print("=" * 50)
    
    for query in test_queries:
        result = service.process_query(query, user_id="test_user_123")
        print(f"\nQuery: {query}")
        print(f"Intent: {result['intent']} (confidence: {result['confidence']:.2f})")
        print(f"Entities: {result['entities']}")
        print(f"Method: {result['method']}")
        print(f"SQL: {result['sql']}")
        print(f"Response: {result['response']}")

if __name__ == "__main__":
    main()
