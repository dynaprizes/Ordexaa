export function generateSerialNumber(): number {
  // Returns a unique 4-digit serial number based on timestamp
  // Format: last 4 digits of current timestamp + random 2 digits
  const timestamp = Date.now().toString()
  const last4 = timestamp.slice(-4)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return parseInt(last4 + random)
}

export function formatSerial(serial: number): string {
  return serial.toString().padStart(4, '0')
}