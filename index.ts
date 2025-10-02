import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type NodeType = "Jump" | "Track" | "Split" | "Root" | "End";

type Node = {
  node: string;
  nodeType: NodeType;
  points: number[];
  to: string[];
}

type Point = {
  position: [number,number,number],
  point: string,
}

/**
 * Encodes a Three.js object or objects into GLB format and returns a Blob.
 * @param mesh - The Three.js object(s) to encode.
 * @returns A promise resolving to a Blob.
 */
export const encodeScene = async (
  mesh:
    | THREE.Object3D<THREE.Object3DEventMap>
    | THREE.Object3D<THREE.Object3DEventMap>[]
): Promise<ArrayBuffer> => {
  const exporter = new GLTFExporter();
  try {
    return await new Promise<ArrayBuffer>((resolve, reject) => {
      exporter.parse(
        mesh,
        (res) => {
          if (!(res instanceof ArrayBuffer)) {
            return reject(
              new Error("Encoding failed: Result is not an ArrayBuffer."),
            );
          }
          resolve(res);
        },
        (error) => reject(new Error(`GLTF Exporter Error: ${error}`)),
        { binary: true },
      );
    });
  } catch (error) {
    console.error(`Error during encoding: ${error}`);
    throw error;
  }
};

/**
 * Decodes a GLB Blob back into a Three.js scene.
 * @param blob - The GLB Blob to decode.
 * @returns A promise resolving to a THREE.Group containing the loaded objects.
 */
export const decodeAndParseBlob = async (buffer: ArrayBuffer)
: Promise<{ scene: THREE.Group, point: Point, nodes: Node[] }> => {
  try {
    
    const scene = await decodeBlob(buffer);
    const segment = scene.getObjectByName("Segment")
    if (!segment) {
      throw new Error("Segment does not exists!");
    }  

    const point = segment.userData.point;
    const nodes = await parseNodes(segment);

    if (!point) {
      throw Error("Point was not found on scene!")
    }

    return { scene, point, nodes }
  } catch (error) {
    console.error(`Error during decoding: ${error}`);
    throw error;
  }
};

const decodeBlob = async (buffer: ArrayBuffer): Promise<THREE.Group> => {
  const loader = new GLTFLoader();

  try {
    const gltf = await new Promise<THREE.Group>((resolve, reject) => {
      loader.parse(
        buffer,
        "",
        (gltf) => resolve(gltf.scene),
        (error) => reject(new Error(`GLTF Loader Error: ${error}`))
      );
    });

    return gltf;
  } catch (error) {
    console.error(`Error during decoding: ${error}`);
    throw error;
  }
}

const parseNodes = (segment: THREE.Object3D<THREE.Object3DEventMap>): Node[] => {
  const nodes = segment.getObjectByName("Nodes");
  if (!nodes) {
    console.warn("Nodes not found on segment!")
    return []
  }
  return nodes.children.map((node) => ({
    node: node.name,
    nodeType: node.userData.nodeType as NodeType,
    points: Array.from(node.userData.points) || [],
    to: node.userData.to || []
  }));
};
