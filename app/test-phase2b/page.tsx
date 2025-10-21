'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

interface TestResult {
  query: string
  intent: string
  confidence: number
  entities: any
  response: string
  method: string
  context?: any[]
  suggestions?: string[]
}

export default function TestPhase2B() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')

  const testQueries = [
    "How much did I spend on dining last month?",
    "What about groceries?", // Context test
    "Find my Starbucks purchases", // Transaction search
    "What's my checking balance?", // Account balance
    "How is my spending trending?", // Trend analysis
    "Show me my entertainment spending",
    "What did I save this month?",
    "Tell me a joke" // Unknown intent test
  ]

  const runTest = async (testQuery: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/nlp/parse-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: testQuery }),
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const result = await response.json()
      
      setResults(prev => [...prev, {
        query: testQuery,
        intent: result.intent,
        confidence: result.confidence,
        entities: result.entities,
        response: result.response,
        method: result.method,
        context: result.context,
        suggestions: result.suggestions
      }])
    } catch (error) {
      console.error('Test error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runAllTests = async () => {
    setResults([])
    for (const testQuery of testQueries) {
      await runTest(testQuery)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Delay between tests
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Phase 2B: Enhanced NLP Testing</CardTitle>
          <p className="text-gray-600">
            Test the enhanced NLP system with context memory, new intent categories, and improved entity extraction.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Controls */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Custom Query:</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a test query..."
                onKeyPress={(e) => e.key === 'Enter' && runTest(query)}
              />
            </div>
            <Button onClick={() => runTest(query)} disabled={!query.trim() || isLoading}>
              Test Query
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={runAllTests} disabled={isLoading}>
              {isLoading ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </div>

          {/* Test Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results ({results.length})</h3>
              {results.map((result, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Query */}
                      <div>
                        <p className="font-medium text-gray-900">Query:</p>
                        <p className="text-gray-700">"{result.query}"</p>
                      </div>

                      {/* Intent & Confidence */}
                      <div className="flex gap-4 items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Intent:</p>
                          <Badge variant="secondary">{result.intent}</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Confidence:</p>
                          <Badge variant="outline">
                            {Math.round(result.confidence * 100)}%
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Method:</p>
                          <Badge variant="outline">{result.method}</Badge>
                        </div>
                      </div>

                      {/* Entities */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Entities:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(result.entities).map(([key, value]) => (
                            value && (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            )
                          ))}
                        </div>
                      </div>

                      {/* Response */}
                      <div>
                        <p className="text-sm font-medium text-gray-600">Response:</p>
                        <p className="text-gray-700 bg-gray-50 p-2 rounded">
                          {result.response}
                        </p>
                      </div>

                      {/* Context */}
                      {result.context && result.context.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Context:</p>
                          <div className="bg-blue-50 p-2 rounded text-sm">
                            {result.context.slice(-2).map((ctx, idx) => (
                              <p key={idx} className="text-blue-700">
                                "{ctx.query}" → {ctx.intent}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {result.suggestions && result.suggestions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Suggestions:</p>
                          <div className="flex flex-wrap gap-1">
                            {result.suggestions.slice(0, 3).map((suggestion, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Phase 2B Features Summary */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-green-800 mb-2">Phase 2B Features Implemented:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ <strong>Context Memory:</strong> Remembers previous queries for follow-up questions</li>
                <li>✅ <strong>New Intent Categories:</strong> Transaction search, account balance, trend analysis</li>
                <li>✅ <strong>Enhanced Entity Extraction:</strong> Better merchant, amount, and date recognition</li>
                <li>✅ <strong>Smart Suggestions:</strong> Contextual suggestions based on query patterns</li>
                <li>✅ <strong>Hybrid Approach:</strong> Combines rule-based and ML for better accuracy</li>
                <li>✅ <strong>Improved Error Handling:</strong> Graceful handling of unknown queries</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
