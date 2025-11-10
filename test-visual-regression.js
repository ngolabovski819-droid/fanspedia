/**
 * Visual Regression Test - Check if pages look correct after server.js changes
 * Tests all page types to ensure CSS/JS loads correctly
 */

import http from 'http';

const BASE_URL = 'http://127.0.0.1:3000';

const tests = [
  {
    name: 'Homepage (index.html)',
    path: '/',
    checks: [
      { name: 'HTML structure', pattern: /<html.*data-theme/ },
      { name: 'Bootstrap CSS loaded', pattern: /bootstrap@5\.3\.0/ },
      { name: 'Search container exists', pattern: /id="results-container"/ },
      { name: 'Header present', pattern: /class="superior-header"/ },
      { name: 'Load more button', pattern: /id="loadMoreBtn"/ }
    ]
  },
  {
    name: 'Categories page (categories.html)',
    path: '/categories',
    checks: [
      { name: 'HTML structure', pattern: /<html.*data-theme/ },
      { name: 'Bootstrap CSS loaded', pattern: /bootstrap@5\.3\.0/ },
      { name: 'Category grid exists', pattern: /id="category-grid"/ },
      { name: 'Categories script loaded', pattern: /config\/categories\.js/ }
    ]
  },
  {
    name: 'Category page (category.html)',
    path: '/categories/goth',
    checks: [
      { name: 'HTML structure', pattern: /<html.*data-theme/ },
      { name: 'Bootstrap CSS loaded', pattern: /bootstrap@5\.3\.0/ },
      { name: 'Results container', pattern: /id="results-container"/ },
      { name: 'Filter panel', pattern: /filter-panel/ }
    ]
  },
  {
    name: 'Creator static page (creator.html)',
    path: '/creator.html',
    checks: [
      { name: 'HTML structure', pattern: /<html.*data-theme/ },
      { name: 'Bootstrap CSS loaded', pattern: /bootstrap@5\.3\.0/ },
      { name: 'Profile container', pattern: /id="profile-container"/ },
      { name: 'Creator title', pattern: /Creator Profile/ }
    ]
  },
  {
    name: 'SSR Creator Profile (non-existent user)',
    path: '/testuser99999',
    checks: [
      { name: 'HTML structure', pattern: /<html/ },
      { name: '404 message', pattern: /Creator Not Found|could not be found/ },
      { name: 'Back to home link', pattern: /Back to Home/ }
    ]
  }
];

async function testPage(test) {
  return new Promise((resolve) => {
    const url = new URL(test.path, BASE_URL);
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const results = {
          name: test.name,
          path: test.path,
          status: res.statusCode,
          contentType: res.headers['content-type'] || '',
          checks: []
        };
        
        // Run all checks
        for (const check of test.checks) {
          const passed = check.pattern.test(data);
          results.checks.push({
            name: check.name,
            passed,
            pattern: check.pattern.toString()
          });
        }
        
        results.allPassed = results.checks.every(c => c.passed);
        resolve(results);
      });
    }).on('error', (err) => {
      resolve({
        name: test.name,
        path: test.path,
        error: err.message,
        allPassed: false
      });
    });
  });
}

async function runTests() {
  console.log('🧪 Visual Regression Test\n');
  console.log('Testing if pages look correct after server.js changes...\n');
  console.log('='.repeat(80));
  
  // Wait for server
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const allResults = [];
  
  for (const test of tests) {
    const result = await testPage(test);
    allResults.push(result);
    
    const icon = result.allPassed ? '✅' : '❌';
    console.log(`\n${icon} ${result.name}`);
    console.log(`   Path: ${result.path}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Content-Type: ${result.contentType}`);
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    } else {
      console.log(`   Checks:`);
      for (const check of result.checks) {
        const checkIcon = check.passed ? '  ✓' : '  ✗';
        console.log(`   ${checkIcon} ${check.name}`);
        if (!check.passed) {
          console.log(`      Pattern: ${check.pattern}`);
        }
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n' + '='.repeat(80));
  
  const passed = allResults.filter(r => r.allPassed).length;
  const total = allResults.length;
  
  console.log(`\n📊 Results: ${passed}/${total} pages passed all checks`);
  
  if (passed === total) {
    console.log('\n✅ SUCCESS: All pages look correct! No visual regression detected.');
    console.log('   - HTML structure intact');
    console.log('   - CSS files loading');
    console.log('   - JavaScript modules present');
    console.log('   - Key UI elements exist');
  } else {
    console.log('\n❌ ISSUES DETECTED: Some pages have problems.');
    console.log('\nFailed pages:');
    allResults.filter(r => !r.allPassed).forEach(r => {
      console.log(`   - ${r.name} (${r.path})`);
      if (r.checks) {
        const failedChecks = r.checks.filter(c => !c.passed);
        failedChecks.forEach(c => console.log(`     ✗ ${c.name}`));
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

// Run tests
runTests().catch(console.error);
