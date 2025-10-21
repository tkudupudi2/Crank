#!/usr/bin/env python3
"""
Simple NLP Service
Rule-based approach for financial query processing
"""

import json
from typing import Dict, Any, Optional
from rule_based_nlp import RuleBasedNLP, QueryResult

class SimpleNLPService:
    def __init__(self):
        self.rule_based = RuleBasedNLP()
    
    def process_query(self, query: str, user_id: str = None) -> Dict[str, Any]:
        """Process a natural language query and return structured result"""
        result = self.rule_based.parse_query(query)
        
        return {
            "intent": result.intent,
            "entities": result.entities,
            "confidence": result.confidence,
            "sql_query": result.sql_query,
            "response_template": result.response_template,
            "method": "rule_based"
        }
    
    def get_supported_intents(self) -> list:
        """Get list of supported intents"""
        return ["spending_analysis", "savings_analysis", "budget_analysis", "category_breakdown"]
    
    def get_entity_types(self) -> list:
        """Get list of supported entity types"""
        return ["category", "timeframe", "amount", "account", "merchant"]

# Test the simple service
if __name__ == "__main__":
    service = SimpleNLPService()
    
    test_queries = [
        "How much did I spend on dining last month?",
        "What did I save this month?",
        "How much do I have left in my food budget?",
        "Show me my entertainment spending this week",
        "What's my grocery breakdown last month?"
    ]
    
    print("Testing Simple NLP Service:")
    print("=" * 50)
    
    for query in test_queries:
        result = service.process_query(query)
        print(f"\nQuery: {query}")
        print(f"Intent: {result['intent']} (confidence: {result['confidence']:.2f})")
        print(f"Entities: {result['entities']}")
        print(f"Method: {result['method']}")
        print(f"SQL: {result['sql_query']}")
        print(f"Response: {result['response_template']}")
