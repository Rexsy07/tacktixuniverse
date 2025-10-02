// Test script to verify all cleanup functions are properly exposed
console.log('🧪 TESTING CLEANUP FUNCTIONS');
console.log('='.repeat(40));

// Check if functions are available
const functions = {
  'window.fixAllDuplicates': typeof window?.fixAllDuplicates,
  'window.analyzeDuplicates': typeof window?.analyzeDuplicates, 
  'window.fixDbFunctions': typeof window?.fixDbFunctions,
  'window.checkDuplicate': typeof window?.checkDuplicate,
  'window.quickCleanupDuplicate': typeof window?.quickCleanupDuplicate
};

console.log('📋 Function Availability:');
Object.entries(functions).forEach(([name, type]) => {
  const status = type === 'function' ? '✅ Available' : '❌ Missing';
  console.log(`${status} ${name}: ${type}`);
});

console.log('\n🚀 Ready to use commands:');
if (typeof window?.analyzeDuplicates === 'function') {
  console.log('📊 Analyze all duplicates: await window.analyzeDuplicates()');
}
if (typeof window?.fixAllDuplicates === 'function') {
  console.log('🔧 Fix all duplicates: await window.fixAllDuplicates()');
}
if (typeof window?.checkDuplicate === 'function') {
  console.log('🔍 Check specific match: await window.checkDuplicate()');
}

console.log('\n💡 If any functions are missing, refresh the page and try again.');
console.log('='.repeat(40));