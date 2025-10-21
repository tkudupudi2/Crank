# Financial NLP System

## Overview
A natural language processing system for financial queries that can understand user questions about spending, savings, budgets, and category breakdowns.

## Phase 1A: Data Collection & Model Training ✅

### What We Built

#### 1. Training Data Generator (`scripts/generate_training_data.py`)
- **Generates 150 synthetic training examples**
- **4 Intent Categories**: spending_analysis, savings_analysis, budget_analysis, category_breakdown
- **Entity Types**: category, timeframe, amount, account, merchant
- **Data Augmentation**: Creates variations of each query for better training

#### 2. Rule-Based NLP System (`scripts/rule_based_nlp.py`)
- **Intent Classification**: Pattern matching for 4 financial intents
- **Entity Extraction**: Extracts categories, timeframes, amounts, accounts, merchants
- **SQL Query Generation**: Converts natural language to database queries
- **Response Templates**: Generates natural language responses

#### 3. Simple NLP Service (`scripts/simple_nlp_service.py`)
- **Integrated Service**: Combines all NLP components
- **API-Ready**: Returns structured JSON responses
- **Confidence Scoring**: Provides confidence levels for predictions

### Test Results ✅

All test queries working correctly:

```
Query: "How much did I spend on dining last month?"
Intent: spending_analysis (confidence: 1.00)
Entities: {category: 'dining', timeframe: 'last month'}
SQL: SELECT SUM(amount) FROM transactions WHERE category IN ('Food & Drink', 'Restaurants') AND date BETWEEN '2025-09-01' AND '2025-09-30'
Response: "You spent ${amount} on dining last month"

Query: "What did I save this month?"
Intent: savings_analysis (confidence: 1.00)
Entities: {timeframe: 'this month'}
SQL: SELECT SUM(amount) FROM transactions WHERE amount > 0 AND date BETWEEN '2025-10-01' AND '2025-10-21'
Response: "You saved ${amount} this month"

Query: "How much do I have left in my food budget?"
Intent: budget_analysis (confidence: 1.00)
Entities: {category: 'dining'}
SQL: SELECT budget_amount - spent_amount FROM budgets WHERE category = 'dining' AND month = '2025-10'
Response: "You have ${amount} left in your dining budget"

Query: "Show me my entertainment spending this week"
Intent: spending_analysis (confidence: 1.00)
Entities: {category: 'entertainment', timeframe: 'this week'}
SQL: SELECT SUM(amount) FROM transactions WHERE category IN ('Entertainment', 'Movies', 'Streaming') AND date BETWEEN '2025-10-20' AND '2025-10-21'
Response: "You spent ${amount} on entertainment this week"

Query: "What's my grocery breakdown last month?"
Intent: category_breakdown (confidence: 1.00)
Entities: {category: 'groceries', timeframe: 'last month'}
SQL: SELECT category, SUM(amount) FROM transactions WHERE category IN ('Food & Drink', 'Groceries') AND date BETWEEN '2025-09-01' AND '2025-09-30' GROUP BY category
Response: "Here's your groceries spending last month: {{breakdown}}"
```

### Supported Intents
1. **spending_analysis** - "How much did I spend on X?"
2. **savings_analysis** - "How much did I save?"
3. **budget_analysis** - "How much left in my budget?"
4. **category_breakdown** - "What did I spend on food?"

### Supported Entities
- **category**: dining, groceries, entertainment, transportation, shopping, utilities, healthcare, education
- **timeframe**: last month, this month, last week, this week, past 3 days, past week, this year, last year
- **amount**: $100, 500 dollars, five hundred
- **account**: checking, savings, credit card, Chase card
- **merchant**: Amazon, Starbucks, Shell, Target, Walmart, Netflix

### Next Steps (Phase 1B: Backend API)
1. **Create Next.js API routes** for NLP processing
2. **Integrate with Prisma database** for query execution
3. **Add WebSocket support** for real-time chat
4. **Build chat widget** for frontend integration

### Files Created
- `scripts/generate_training_data.py` - Training data generator
- `scripts/rule_based_nlp.py` - Core NLP logic
- `scripts/simple_nlp_service.py` - Integrated service
- `data/training/training_data.jsonl` - Generated training data
- `requirements.txt` - Python dependencies

### Usage
```python
from scripts.simple_nlp_service import SimpleNLPService

service = SimpleNLPService()
result = service.process_query("How much did I spend on dining last month?")
print(result)
```

## Status: Phase 1A Complete ✅
Ready to move to Phase 1B: Backend API Integration
