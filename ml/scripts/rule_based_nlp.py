#!/usr/bin/env python3
"""
Rule-Based NLP System for Financial Queries
Handles intent classification and entity extraction using pattern matching
"""

import re
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

@dataclass
class QueryResult:
    intent: str
    entities: Dict[str, Any]
    confidence: float
    sql_query: str
    response_template: str

class RuleBasedNLP:
    def __init__(self):
        self.intent_patterns = {
            "spending_analysis": [
                r"how much.*spent.*",
                r"what.*spent.*",
                r"show.*spending.*",
                r"display.*spending.*",
                r"how much.*money.*use.*",
                r"what.*expense.*",
                r"how much.*pay.*",
                r"show.*costs.*",
                r"how much.*spend.*"
            ],
            "savings_analysis": [
                r"how much.*save.*",
                r"what.*save.*",
                r"show.*savings.*",
                r"display.*savings.*",
                r"how much.*money.*save.*",
                r"what.*savings.*",
                r"show.*saved.*",
                r"how much.*put aside.*"
            ],
            "budget_analysis": [
                r"how much.*left.*budget.*",
                r"what.*left.*budget.*",
                r"show.*budget.*remaining.*",
                r"how much.*budget.*",
                r"what.*budget.*status.*",
                r"display.*budget.*left.*",
                r"show.*budget.*remaining.*",
                r"how much.*left.*for.*"
            ],
            "category_breakdown": [
                r"what.*spend.*on.*",
                r"show.*spending.*",
                r"break down.*expenses.*",
                r"what.*breakdown.*",
                r"display.*spending.*",
                r"show.*costs.*",
                r"what.*buy.*in.*",
                r"give.*spending.*details.*",
                r"grocery.*breakdown.*",
                r"breakdown.*grocery.*"
            ]
        }
        
        self.category_mapping = {
            "dining": ["dining", "food", "restaurants", "eating out", "meals"],
            "groceries": ["groceries", "grocery", "food shopping", "supermarket", "grocery store"],
            "entertainment": ["entertainment", "fun", "leisure", "recreation", "movies", "streaming"],
            "transportation": ["transportation", "travel", "commute", "gas", "fuel"],
            "shopping": ["shopping", "online", "retail", "stores"],
            "utilities": ["utilities", "electricity", "water", "internet", "phone"],
            "healthcare": ["healthcare", "medical", "pharmacy", "doctor", "hospital"],
            "education": ["education", "school", "training", "courses", "books"]
        }
        
        self.timeframe_patterns = {
            "last month": r"last month|previous month|past month",
            "this month": r"this month|current month|present month",
            "last week": r"last week|previous week|past week",
            "this week": r"this week|current week|present week",
            "past 3 days": r"past 3 days|last 3 days|past few days",
            "past week": r"past week|last 7 days|past 7 days",
            "this year": r"this year|current year|present year",
            "last year": r"last year|previous year|past year"
        }
        
        self.account_patterns = {
            "checking": r"checking|checking account",
            "savings": r"savings|savings account",
            "credit card": r"credit card|credit|card",
            "chase": r"chase|chase card|chase bank",
            "wells fargo": r"wells fargo|wells"
        }

    def parse_query(self, query: str) -> QueryResult:
        """Parse a natural language query and return structured result"""
        query_lower = query.lower().strip()
        
        # Classify intent
        intent, intent_confidence = self._classify_intent(query_lower)
        
        # Extract entities
        entities = self._extract_entities(query_lower)
        
        # Generate SQL query
        sql_query = self._generate_sql_query(intent, entities)
        
        # Generate response template
        response_template = self._generate_response_template(intent, entities)
        
        return QueryResult(
            intent=intent,
            entities=entities,
            confidence=intent_confidence,
            sql_query=sql_query,
            response_template=response_template
        )

    def _classify_intent(self, query: str) -> Tuple[str, float]:
        """Classify the intent of the query using pattern matching"""
        best_intent = "unknown"
        best_confidence = 0.0
        
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, query, re.IGNORECASE):
                    # Calculate confidence based on pattern match quality
                    match = re.search(pattern, query, re.IGNORECASE)
                    if match:
                        confidence = len(match.group()) / len(query)
                        if confidence > best_confidence:
                            best_confidence = confidence
                            best_intent = intent
        
        # Boost confidence for exact matches
        if best_confidence > 0.5:
            best_confidence = min(1.0, best_confidence + 0.2)
        
        return best_intent, best_confidence

    def _extract_entities(self, query: str) -> Dict[str, Any]:
        """Extract entities from the query"""
        entities = {
            "category": None,
            "timeframe": None,
            "amount": None,
            "account": None,
            "merchant": None
        }
        
        # Extract category
        entities["category"] = self._extract_category(query)
        
        # Extract timeframe
        entities["timeframe"] = self._extract_timeframe(query)
        
        # Extract amount
        entities["amount"] = self._extract_amount(query)
        
        # Extract account
        entities["account"] = self._extract_account(query)
        
        # Extract merchant
        entities["merchant"] = self._extract_merchant(query)
        
        return entities

    def _extract_category(self, query: str) -> Optional[str]:
        """Extract spending category from query"""
        query_lower = query.lower()
        for category, keywords in self.category_mapping.items():
            for keyword in keywords:
                if keyword in query_lower:
                    return category
        return None

    def _extract_timeframe(self, query: str) -> Optional[str]:
        """Extract timeframe from query"""
        for timeframe, pattern in self.timeframe_patterns.items():
            if re.search(pattern, query, re.IGNORECASE):
                return timeframe
        return None

    def _extract_amount(self, query: str) -> Optional[float]:
        """Extract amount from query"""
        # Look for dollar amounts
        dollar_pattern = r'\$(\d+(?:\.\d{2})?)'
        match = re.search(dollar_pattern, query)
        if match:
            return float(match.group(1))
        
        # Look for number + "dollars"
        dollar_text_pattern = r'(\d+(?:\.\d{2})?)\s*dollars?'
        match = re.search(dollar_text_pattern, query)
        if match:
            return float(match.group(1))
        
        # Look for written numbers (basic)
        written_numbers = {
            "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
            "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
            "hundred": 100, "thousand": 1000
        }
        
        for word, number in written_numbers.items():
            if word in query:
                return float(number)
        
        return None

    def _extract_account(self, query: str) -> Optional[str]:
        """Extract account type from query"""
        for account, pattern in self.account_patterns.items():
            if re.search(pattern, query, re.IGNORECASE):
                return account
        return None

    def _extract_merchant(self, query: str) -> Optional[str]:
        """Extract merchant name from query"""
        # Common merchants
        merchants = ["amazon", "starbucks", "shell", "target", "walmart", "netflix", "spotify"]
        
        for merchant in merchants:
            if merchant in query:
                return merchant.title()
        
        return None

    def _generate_sql_query(self, intent: str, entities: Dict[str, Any]) -> str:
        """Generate SQL query based on intent and entities"""
        if intent == "spending_analysis":
            return self._generate_spending_sql(entities)
        elif intent == "savings_analysis":
            return self._generate_savings_sql(entities)
        elif intent == "budget_analysis":
            return self._generate_budget_sql(entities)
        elif intent == "category_breakdown":
            return self._generate_category_sql(entities)
        else:
            return "SELECT 1"  # Default query

    def _generate_spending_sql(self, entities: Dict[str, Any]) -> str:
        """Generate SQL for spending analysis"""
        category = entities.get("category")
        timeframe = entities.get("timeframe")
        
        if not category or not timeframe:
            return "SELECT 1"
        
        # Map category to database categories
        category_mapping = {
            "dining": "('Food & Drink', 'Restaurants')",
            "groceries": "('Food & Drink', 'Groceries')",
            "entertainment": "('Entertainment', 'Movies', 'Streaming')",
            "transportation": "('Transportation', 'Gas', 'Public Transit')",
            "shopping": "('Shopping', 'Online', 'Retail')",
            "utilities": "('Utilities', 'Electricity', 'Water')",
            "healthcare": "('Healthcare', 'Medical', 'Pharmacy')",
            "education": "('Education', 'School', 'Training')"
        }
        
        categories = category_mapping.get(category, f"('{category}')")
        date_range = self._get_date_range(timeframe)
        
        return f"SELECT SUM(amount) FROM transactions WHERE category IN {categories} AND date BETWEEN '{date_range['start']}' AND '{date_range['end']}'"

    def _generate_savings_sql(self, entities: Dict[str, Any]) -> str:
        """Generate SQL for savings analysis"""
        timeframe = entities.get("timeframe", "last month")
        date_range = self._get_date_range(timeframe)
        
        return f"SELECT SUM(amount) FROM transactions WHERE amount > 0 AND date BETWEEN '{date_range['start']}' AND '{date_range['end']}'"

    def _generate_budget_sql(self, entities: Dict[str, Any]) -> str:
        """Generate SQL for budget analysis"""
        category = entities.get("category", "general")
        current_month = datetime.now().strftime("%Y-%m")
        
        return f"SELECT budget_amount - spent_amount FROM budgets WHERE category = '{category}' AND month = '{current_month}'"

    def _generate_category_sql(self, entities: Dict[str, Any]) -> str:
        """Generate SQL for category breakdown"""
        category = entities.get("category")
        timeframe = entities.get("timeframe")
        
        if not category or not timeframe:
            return "SELECT 1"
        
        category_mapping = {
            "dining": "('Food & Drink', 'Restaurants')",
            "groceries": "('Food & Drink', 'Groceries')",
            "entertainment": "('Entertainment', 'Movies', 'Streaming')",
            "transportation": "('Transportation', 'Gas', 'Public Transit')",
            "shopping": "('Shopping', 'Online', 'Retail')",
            "utilities": "('Utilities', 'Electricity', 'Water')",
            "healthcare": "('Healthcare', 'Medical', 'Pharmacy')",
            "education": "('Education', 'School', 'Training')"
        }
        
        categories = category_mapping.get(category, f"('{category}')")
        date_range = self._get_date_range(timeframe)
        
        return f"SELECT category, SUM(amount) FROM transactions WHERE category IN {categories} AND date BETWEEN '{date_range['start']}' AND '{date_range['end']}' GROUP BY category"

    def _generate_response_template(self, intent: str, entities: Dict[str, Any]) -> str:
        """Generate response template based on intent and entities"""
        category = entities.get("category", "items")
        timeframe = entities.get("timeframe", "this period")
        
        if intent == "spending_analysis":
            return f"You spent ${{amount}} on {category} {timeframe}"
        elif intent == "savings_analysis":
            return f"You saved ${{amount}} {timeframe}"
        elif intent == "budget_analysis":
            return f"You have ${{amount}} left in your {category} budget"
        elif intent == "category_breakdown":
            return f"Here's your {category} spending {timeframe}: {{{{breakdown}}}}"
        else:
            return "I found some information for you: {{result}}"

    def _get_date_range(self, timeframe: str) -> Dict[str, str]:
        """Convert timeframe string to date range"""
        now = datetime.now()
        
        if timeframe == "last month":
            start = (now.replace(day=1) - timedelta(days=1)).replace(day=1)
            end = now.replace(day=1) - timedelta(days=1)
        elif timeframe == "this month":
            start = now.replace(day=1)
            end = now
        elif timeframe == "last week":
            start = now - timedelta(days=now.weekday() + 7)
            end = now - timedelta(days=now.weekday() + 1)
        elif timeframe == "this week":
            start = now - timedelta(days=now.weekday())
            end = now
        elif timeframe == "past 3 days":
            start = now - timedelta(days=3)
            end = now
        elif timeframe == "past week":
            start = now - timedelta(days=7)
            end = now
        elif timeframe == "this year":
            start = now.replace(month=1, day=1)
            end = now
        elif timeframe == "last year":
            start = now.replace(year=now.year-1, month=1, day=1)
            end = now.replace(year=now.year-1, month=12, day=31)
        else:
            # Default to last month
            start = (now.replace(day=1) - timedelta(days=1)).replace(day=1)
            end = now.replace(day=1) - timedelta(days=1)
        
        return {
            "start": start.strftime("%Y-%m-%d"),
            "end": end.strftime("%Y-%m-%d")
        }

# Test the rule-based system
if __name__ == "__main__":
    nlp = RuleBasedNLP()
    
    test_queries = [
        "How much did I spend on dining last month?",
        "What did I save this month?",
        "How much do I have left in my food budget?",
        "Show me my entertainment spending this week",
        "What's my grocery breakdown last month?"
    ]
    
    print("Testing Rule-Based NLP System:")
    print("=" * 50)
    
    for query in test_queries:
        result = nlp.parse_query(query)
        print(f"\nQuery: {query}")
        print(f"Intent: {result.intent} (confidence: {result.confidence:.2f})")
        print(f"Entities: {result.entities}")
        print(f"SQL: {result.sql_query}")
        print(f"Response: {result.response_template}")
