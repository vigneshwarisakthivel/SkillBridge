export function encodeTestIdToFakeUuid(testId) {
    const base36 = testId.toString(36);
    return `00000000-0000-0000-0000-${base36.padStart(12, '0')}`;
  }
  
  export function decodeFakeUuidToTestId(fakeUuid) {
    const encoded = fakeUuid.split('-').pop();  // Get the last block
    return parseInt(encoded, 36);              // Convert base36 string to number
  }
  
  