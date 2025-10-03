
// Reset the tour for testing
localStorage.removeItem('loadsTourDismissed');
localStorage.removeItem('loadsTourStep');
localStorage.setItem('loadsTourStep', '1');

console.log('Tour reset! Now:');
console.log('- Go to Loads page');
console.log('- Click on a load row');
console.log('- Step 2 should appear (Related Sales Order)');
console.log('- Click anywhere to proceed to Step 3');
console.log('- Step 3 should highlight Materials tab');
console.log('Tour status:', {
  loadsTourStep: localStorage.getItem('loadsTourStep'),
  loadsTourDismissed: localStorage.getItem('loadsTourDismissed')
});

