// =====================================================
// BROWSER CONSOLE COMMANDS FOR DUPLICATE CLEANUP
// =====================================================
// Copy and paste these commands into your browser console (F12)

console.log('🔧 DUPLICATE TRANSACTION CLEANUP COMMANDS');
console.log('='.repeat(50));

// Test if functions are available
console.log('🧪 Testing function availability...');
const testFunctions = () => {
  const functions = [
    'fixAllDuplicates',
    'analyzeDuplicates', 
    'checkDuplicate',
    'quickCleanupDuplicate'
  ];
  
  functions.forEach(fn => {
    const available = typeof window[fn] === 'function';
    console.log(`${available ? '✅' : '❌'} window.${fn}: ${available ? 'Available' : 'Missing'}`);
  });
  
  console.log('\n📋 Available commands:');
  if (window.analyzeDuplicates) console.log('📊 await window.analyzeDuplicates() - Analyze all duplicates');
  if (window.fixAllDuplicates) console.log('🔧 await window.fixAllDuplicates() - Fix all duplicates');
  if (window.checkDuplicate) console.log('🔍 await window.checkDuplicate() - Check specific match');
  
  return functions.filter(fn => typeof window[fn] === 'function').length;
};

// Run the test
const availableCount = testFunctions();

if (availableCount === 0) {
  console.log('\n⚠️  No functions found. Please refresh the page and try again.');
  console.log('Make sure the app is fully loaded before running these commands.');
} else {
  console.log(`\n✅ ${availableCount} functions available!`);
  
  // Provide easy-to-copy commands
  console.log('\n🚀 COPY AND PASTE THESE COMMANDS:');
  console.log('');
  console.log('// 1. Analyze all duplicate transactions in the system');
  console.log('await window.analyzeDuplicates()');
  console.log('');
  console.log('// 2. Fix ALL duplicate transactions system-wide');
  console.log('await window.fixAllDuplicates()');
  console.log('');
  console.log('// 3. Check the specific problematic match');
  console.log('await window.checkDuplicate()');
  console.log('');
  console.log('// 4. Quick cleanup of the known duplicate');
  console.log('await window.quickCleanupDuplicate()');
}

console.log('\n💡 TIP: Run commands one at a time and wait for results');
console.log('='.repeat(50));

// Also expose the test function globally for easy access
window.testCleanupFunctions = testFunctions;