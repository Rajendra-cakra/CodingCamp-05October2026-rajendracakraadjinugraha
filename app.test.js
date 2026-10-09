'use strict';

// ============================================================================
// Unit Tests for StorageManager Module
// ============================================================================

/**
 * Simple test assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Test failed: ${message}`);
  }
}

/**
 * Test helper to clear localStorage between tests
 */
function clearTestStorage() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('dashboard_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// ============================================================================
// StorageManager Tests
// ============================================================================

/**
 * Test isAvailable() returns true when localStorage is functional
 */
function testIsAvailable() {
  const result = StorageManager.isAvailable();
  assert(result === true, 'isAvailable should return true in supported browser');
  console.log('✓ testIsAvailable passed');
}

/**
 * Test getItem() and setItem() for string values
 */
function testGetSetItem() {
  clearTestStorage();
  
  // Test setting a value
  const success = StorageManager.setItem('test_key', 'test_value');
  assert(success === true, 'setItem should return true on success');
  
  // Test getting the value
  const value = StorageManager.getItem('test_key');
  assert(value === 'test_value', 'getItem should return the stored value');
  
  // Test getting non-existent key with default
  const defaultValue = StorageManager.getItem('nonexistent', 'default');
  assert(defaultValue === 'default', 'getItem should return default for non-existent key');
  
  clearTestStorage();
  console.log('✓ testGetSetItem passed');
}

/**
 * Test removeItem() functionality
 */
function testRemoveItem() {
  clearTestStorage();
  
  // Set a value
  StorageManager.setItem('test_key', 'test_value');
  
  // Verify it exists
  let value = StorageManager.getItem('test_key');
  assert(value === 'test_value', 'Item should exist before removal');
  
  // Remove it
  const success = StorageManager.removeItem('test_key');
  assert(success === true, 'removeItem should return true on success');
  
  // Verify it's gone
  value = StorageManager.getItem('test_key', 'default');
  assert(value === 'default', 'Item should not exist after removal');
  
  clearTestStorage();
  console.log('✓ testRemoveItem passed');
}

/**
 * Test getObject() and setObject() for JSON serialization
 */
function testGetSetObject() {
  clearTestStorage();
  
  // Test with a simple object
  const testObj = {
    name: 'John Doe',
    age: 30,
    active: true,
    items: [1, 2, 3]
  };
  
  // Set object
  const success = StorageManager.setObject('test_obj', testObj);
  assert(success === true, 'setObject should return true on success');
  
  // Get object
  const retrievedObj = StorageManager.getObject('test_obj');
  assert(retrievedObj !== null, 'getObject should return an object');
  assert(retrievedObj.name === 'John Doe', 'Object properties should match');
  assert(retrievedObj.age === 30, 'Object properties should match');
  assert(retrievedObj.active === true, 'Object properties should match');
  assert(Array.isArray(retrievedObj.items), 'Arrays should be preserved');
  assert(retrievedObj.items.length === 3, 'Array length should match');
  
  // Test with default value for non-existent key
  const defaultObj = StorageManager.getObject('nonexistent', { default: true });
  assert(defaultObj.default === true, 'getObject should return default for non-existent key');
  
  clearTestStorage();
  console.log('✓ testGetSetObject passed');
}

/**
 * Test JSON parse error handling
 */
function testInvalidJSON() {
  clearTestStorage();
  
  // Manually insert invalid JSON into localStorage
  localStorage.setItem('dashboard_invalid', '{invalid json}');
  
  // getObject should handle parse error gracefully
  const result = StorageManager.getObject('invalid', { fallback: true });
  assert(result.fallback === true, 'getObject should return default on JSON parse error');
  
  clearTestStorage();
  console.log('✓ testInvalidJSON passed');
}

/**
 * Test empty object storage
 */
function testEmptyObject() {
  clearTestStorage();
  
  const emptyObj = {};
  const success = StorageManager.setObject('empty', emptyObj);
  assert(success === true, 'Should be able to store empty object');
  
  const retrieved = StorageManager.getObject('empty');
  assert(typeof retrieved === 'object', 'Should retrieve object');
  assert(Object.keys(retrieved).length === 0, 'Retrieved object should be empty');
  
  clearTestStorage();
  console.log('✓ testEmptyObject passed');
}

/**
 * Test array storage
 */
function testArrayStorage() {
  clearTestStorage();
  
  const testArray = [
    { id: 1, text: 'Task 1' },
    { id: 2, text: 'Task 2' }
  ];
  
  const success = StorageManager.setObject('tasks', testArray);
  assert(success === true, 'Should be able to store array');
  
  const retrieved = StorageManager.getObject('tasks');
  assert(Array.isArray(retrieved), 'Should retrieve array');
  assert(retrieved.length === 2, 'Array length should match');
  assert(retrieved[0].text === 'Task 1', 'Array contents should match');
  
  clearTestStorage();
  console.log('✓ testArrayStorage passed');
}

/**
 * Test storage key prefixing
 */
function testKeyPrefixing() {
  clearTestStorage();
  
  StorageManager.setItem('mykey', 'myvalue');
  
  // Verify the key is prefixed in actual localStorage
  const directValue = localStorage.getItem('dashboard_mykey');
  assert(directValue === 'myvalue', 'Key should be prefixed with "dashboard_"');
  
  // Verify unprefixed key doesn't exist
  const unprefixed = localStorage.getItem('mykey');
  assert(unprefixed === null, 'Unprefixed key should not exist');
  
  clearTestStorage();
  console.log('✓ testKeyPrefixing passed');
}

/**
 * Test handling of null and undefined values
 */
function testNullUndefinedValues() {
  clearTestStorage();
  
  // Test null in object
  const objWithNull = { value: null };
  StorageManager.setObject('null_obj', objWithNull);
  const retrieved = StorageManager.getObject('null_obj');
  assert(retrieved.value === null, 'Null values should be preserved in objects');
  
  // Test undefined in object (becomes null in JSON)
  const objWithUndefined = { value: undefined };
  StorageManager.setObject('undef_obj', objWithUndefined);
  const retrievedUndef = StorageManager.getObject('undef_obj');
  // undefined becomes null or is omitted in JSON
  assert(!('value' in retrievedUndef) || retrievedUndef.value === null, 
    'Undefined values may be omitted or converted to null');
  
  clearTestStorage();
  console.log('✓ testNullUndefinedValues passed');
}

// ============================================================================
// Run All Tests
// ============================================================================

function runAllTests() {
  console.log('========================================');
  console.log('Running StorageManager Unit Tests');
  console.log('========================================\n');
  
  try {
    testIsAvailable();
    testGetSetItem();
    testRemoveItem();
    testGetSetObject();
    testInvalidJSON();
    testEmptyObject();
    testArrayStorage();
    testKeyPrefixing();
    testNullUndefinedValues();
    
    console.log('\n========================================');
    console.log('All tests passed! ✓');
    console.log('========================================');
  } catch (error) {
    console.error('\n========================================');
    console.error('Test suite failed!');
    console.error(error.message);
    console.error('========================================');
  }
}

// Run tests when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  runAllTests();
}
