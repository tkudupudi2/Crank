#!/usr/bin/env python3
"""
Training Data Generator for Financial NLP System
Generates synthetic training data for intent classification and entity extraction
"""

import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import jsonlines

class TrainingDataGenerator:
    def __init__(self):
        self.intents = [
            "spending_analysis",
            "savings_analysis", 
            "budget_analysis",
            "category_breakdown"
        ]
        
        self.categories = [
            "dining", "groceries", "entertainment", "transportation", 
            "shopping", "utilities", "healthcare", "education"
        ]
        
        self.timeframes = [
            "last month", "this month", "last week", "this week",
            "past 3 days", "past week", "this year", "last year"
        ]
        
        self.accounts = [
            "checking", "savings", "credit card", "Chase card", "Wells Fargo"
        ]
        
        self.merchants = [
            "Amazon", "Starbucks", "Shell", "Target", "Walmart", "Netflix"
        ]

    def generate_spending_analysis_queries(self, count: int = 50) -> List[Dict[str, Any]]:
        """Generate queries for spending analysis intent"""
        templates = [
            "How much did I spend on {category} {timeframe}?",
            "What did I spend on {category} {timeframe}?",
            "Show me my {category} spending {timeframe}",
            "How much money did I use for {category} {timeframe}?",
            "What's my {category} expense {timeframe}?",
            "How much did I pay for {category} {timeframe}?",
            "Display my {category} costs {timeframe}",
            "Show me {category} expenses {timeframe}"
        ]
        
        queries = []
        for _ in range(count):
            template = random.choice(templates)
            category = random.choice(self.categories)
            timeframe = random.choice(self.timeframes)
            
            query = template.format(category=category, timeframe=timeframe)
            
            # Generate variations
            variations = self._generate_variations(query, category, timeframe)
            
            queries.append({
                "id": f"spending_{len(queries):03d}",
                "query": query,
                "intent": "spending_analysis",
                "entities": {
                    "category": category,
                    "timeframe": timeframe,
                    "amount": None
                },
                "variations": variations,
                "expected_sql": self._generate_spending_sql(category, timeframe),
                "response_template": f"You spent ${{amount}} on {category} {timeframe}"
            })
        
        return queries

    def generate_savings_analysis_queries(self, count: int = 30) -> List[Dict[str, Any]]:
        """Generate queries for savings analysis intent"""
        templates = [
            "How much did I save {timeframe}?",
            "What did I save {timeframe}?",
            "Show me my savings {timeframe}",
            "How much money did I save {timeframe}?",
            "What's my savings {timeframe}?",
            "Display my savings {timeframe}",
            "Show me savings {timeframe}",
            "How much did I put aside {timeframe}?"
        ]
        
        queries = []
        for _ in range(count):
            template = random.choice(templates)
            timeframe = random.choice(self.timeframes)
            
            query = template.format(timeframe=timeframe)
            variations = self._generate_variations(query, None, timeframe)
            
            queries.append({
                "id": f"savings_{len(queries):03d}",
                "query": query,
                "intent": "savings_analysis",
                "entities": {
                    "category": None,
                    "timeframe": timeframe,
                    "amount": None
                },
                "variations": variations,
                "expected_sql": self._generate_savings_sql(timeframe),
                "response_template": f"You saved ${{amount}} {timeframe}"
            })
        
        return queries

    def generate_budget_analysis_queries(self, count: int = 30) -> List[Dict[str, Any]]:
        """Generate queries for budget analysis intent"""
        templates = [
            "How much do I have left in my {category} budget?",
            "What's left in my {category} budget?",
            "Show me my {category} budget remaining",
            "How much budget do I have for {category}?",
            "What's my {category} budget status?",
            "Display my {category} budget left",
            "Show me {category} budget remaining",
            "How much is left for {category}?"
        ]
        
        queries = []
        for _ in range(count):
            template = random.choice(templates)
            category = random.choice(self.categories)
            
            query = template.format(category=category)
            variations = self._generate_variations(query, category, None)
            
            queries.append({
                "id": f"budget_{len(queries):03d}",
                "query": query,
                "intent": "budget_analysis",
                "entities": {
                    "category": category,
                    "timeframe": None,
                    "amount": None
                },
                "variations": variations,
                "expected_sql": self._generate_budget_sql(category),
                "response_template": f"You have ${{amount}} left in your {category} budget"
            })
        
        return queries

    def generate_category_breakdown_queries(self, count: int = 40) -> List[Dict[str, Any]]:
        """Generate queries for category breakdown intent"""
        templates = [
            "What did I spend on {category} {timeframe}?",
            "Show me my {category} spending {timeframe}",
            "Break down my {category} expenses {timeframe}",
            "What's my {category} breakdown {timeframe}?",
            "Display {category} spending {timeframe}",
            "Show me {category} costs {timeframe}",
            "What did I buy in {category} {timeframe}?",
            "Give me {category} spending details {timeframe}"
        ]
        
        queries = []
        for _ in range(count):
            template = random.choice(templates)
            category = random.choice(self.categories)
            timeframe = random.choice(self.timeframes)
            
            query = template.format(category=category, timeframe=timeframe)
            variations = self._generate_variations(query, category, timeframe)
            
            queries.append({
                "id": f"category_{len(queries):03d}",
                "query": query,
                "intent": "category_breakdown",
                "entities": {
                    "category": category,
                    "timeframe": timeframe,
                    "amount": None
                },
                "variations": variations,
                "expected_sql": self._generate_category_sql(category, timeframe),
                "response_template": f"Here's your {category} spending {timeframe}: {{{{breakdown}}}}"
            })
        
        return queries

    def _generate_variations(self, query: str, category: str, timeframe: str) -> List[str]:
        """Generate natural language variations of a query"""
        variations = []
        
        # Synonym replacements
        synonyms = {
            "spend": ["use", "pay", "buy", "purchase"],
            "show": ["display", "give me", "tell me"],
            "how much": ["what", "how many"],
            "did I": ["have I", "was I"],
            "last month": ["previous month", "past month"],
            "this month": ["current month", "present month"],
            "dining": ["food", "restaurants", "eating out"],
            "groceries": ["food shopping", "supermarket", "grocery store"],
            "entertainment": ["fun", "leisure", "recreation"],
            "transportation": ["travel", "commute", "gas"]
        }
        
        for original, replacements in synonyms.items():
            if original in query.lower():
                for replacement in replacements[:2]:  # Limit to 2 variations per synonym
                    variation = query.lower().replace(original, replacement)
                    variations.append(variation.capitalize())
        
        return variations[:3]  # Return max 3 variations

    def _generate_spending_sql(self, category: str, timeframe: str) -> str:
        """Generate SQL query for spending analysis"""
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

    def _generate_savings_sql(self, timeframe: str) -> str:
        """Generate SQL query for savings analysis"""
        date_range = self._get_date_range(timeframe)
        return f"SELECT SUM(amount) FROM transactions WHERE amount > 0 AND date BETWEEN '{date_range['start']}' AND '{date_range['end']}'"

    def _generate_budget_sql(self, category: str) -> str:
        """Generate SQL query for budget analysis"""
        return f"SELECT budget_amount - spent_amount FROM budgets WHERE category = '{category}' AND month = '{datetime.now().strftime('%Y-%m')}'"

    def _generate_category_sql(self, category: str, timeframe: str) -> str:
        """Generate SQL query for category breakdown"""
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

    def generate_all_training_data(self) -> List[Dict[str, Any]]:
        """Generate complete training dataset"""
        all_queries = []
        
        all_queries.extend(self.generate_spending_analysis_queries(50))
        all_queries.extend(self.generate_savings_analysis_queries(30))
        all_queries.extend(self.generate_budget_analysis_queries(30))
        all_queries.extend(self.generate_category_breakdown_queries(40))
        
        return all_queries

    def save_training_data(self, queries: List[Dict[str, Any]], filename: str = "training_data.jsonl"):
        """Save training data to JSONL file"""
        filepath = f"data/training/{filename}"
        
        with jsonlines.open(filepath, mode='w') as writer:
            for query in queries:
                writer.write(query)
        
        print(f"Saved {len(queries)} training examples to {filepath}")

if __name__ == "__main__":
    generator = TrainingDataGenerator()
    training_data = generator.generate_all_training_data()
    generator.save_training_data(training_data)
    
    print(f"Generated {len(training_data)} training examples")
    print(f"Intent distribution:")
    intent_counts = {}
    for query in training_data:
        intent = query['intent']
        intent_counts[intent] = intent_counts.get(intent, 0) + 1
    
    for intent, count in intent_counts.items():
        print(f"  {intent}: {count}")
