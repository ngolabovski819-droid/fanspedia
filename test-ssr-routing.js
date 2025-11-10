/**
 * Test script for SSR routing
 * Tests local dev server routes to ensure they match Vercel production
 */

import http from 'http';

const BASE_URL = 'http://127.0.0.1:3000';

// Test cases matching vercel.json rewrites
const tests = [
  {
    name: 'Homepage',
    path: '/',
    expectedStatus: 200,
    expectedContentType: 'text/html'
  },
  {
    name: 'Categories hub',
    path: '/categories',
    expectedStatus: 200,
    expectedContentType: 'text/html'
  },
  {
    name: 'Search API',
    path: '/api/search?q=test&page=1',
    expectedStatus: 200,
    expectedContentType: 'application/json'
  },
  {
    name: 'SSR Creator Profile (should attempt to render)',
    path: '/testuser123',
    expectedStatus: [200, 404, 500], // 200 if exists, 404 if not found, 500 if DB error
    expectedContentType: 'text/html'
  }
];

async function testRoute(test) {
  return new Promise((resolve) => {
    const url = new URL(test.path, BASE_URL);
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const contentType = res.headers['content-type'] || '';
        const statusMatch = Array.isArray(test.expectedStatus) 
          ? test.expectedStatus.includes(res.statusCode)
          : res.statusCode === test.expectedStatus;
        
        const contentTypeMatch = contentType && test.expectedContentType 
          ? contentType.includes(test.expectedContentType)
          : false;
        
        const result = {
          ...test,
          actualStatus: res.statusCode,
          actualContentType: contentType,
          passed: statusMatch && contentTypeMatch,
          dataPreview: data.substring(0, 200)
        };
        
        resolve(result);
      });
    }).on('error', (err) => {
      resolve({
        ...test,
        passed: false,
        error: err.message
      });
    });
  });
}

async function runTests() {
  console.log('🧪 Testing SSR Routing\n');
  console.log('=' .repeat(80));
  
  // Wait for server to be ready
  console.log('⏳ Waiting for server to be ready...\n');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const results = [];
  
  for (const test of tests) {
    const result = await testRoute(test);
    results.push(result);
    
    // Add small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const icon = result.passed ? '✅' : '❌';
    console.log(`\n${icon} ${result.name}`);
    console.log(`   Path: ${result.path}`);
    console.log(`   Status: ${result.actualStatus} ${result.passed ? '(PASS)' : '(FAIL)'}`);
    console.log(`   Content-Type: ${result.actualContentType}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (!result.passed && !result.error) {
      console.log(`   Expected Status: ${JSON.stringify(result.expectedStatus)}`);
      console.log(`   Expected Content-Type: ${result.expectedContentType}`);
    }
    
    // Show data preview for HTML responses
    if (result.actualContentType && result.actualContentType.includes('text/html') && result.dataPreview) {
      const preview = result.dataPreview.replace(/\n/g, ' ').substring(0, 100);
      console.log(`   Preview: ${preview}...`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed! SSR routing is working correctly.');
  } else {
    console.log('❌ Some tests failed. Check the output above for details.');
  }
}

// Run tests
runTests().catch(console.error);
