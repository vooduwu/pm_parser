

import { decodeAndParseBlob } from ".";

/**
 * Reads binary data from stdin and processes it as a GLB.
 */
async function decodeAndParseStdinAsGlb() {
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  // Read all chunks from stdin
  // Bun.stdin.stream is an AsyncIterable<Uint8Array>
  for await (const chunk of Bun.stdin.stream()) {
    chunks.push(chunk);
    totalLength += chunk.length;
  }

  // Concatenate all chunks into a single Uint8Array
  const combinedBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combinedBuffer.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert Uint8Array to ArrayBuffer
  const glbArrayBuffer = combinedBuffer.buffer;

  console.log(`Received GLB ArrayBuffer with byteLength: ${glbArrayBuffer.byteLength}`);

  try {
    const { point, nodes } = await decodeAndParseBlob(glbArrayBuffer);
    console.log(JSON.stringify({ point, nodes }));
    
  } catch (error) {
    console.error("Error processing GLB from stdin:", error);
    // Exit with a non-zero code to indicate an error
    process.exit(1); 
  }
}

// Call the main function
decodeAndParseStdinAsGlb();