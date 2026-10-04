// takeSnapshot(): a real V8 heap snapshot (v8.getHeapSnapshot), reduced to a small summary:
// how many strings the heap holds and which object properties point to large arrays.
// What it leaves out compared with the DevTools Memory panel: retainer paths, retained sizes and
// most node types — it is a lab helper, not a profiler.
import v8 from 'node:v8';

export async function takeSnapshot() {
  let text = '';
  for await (const chunk of v8.getHeapSnapshot()) text += chunk;
  const { snapshot, nodes, edges, strings } = JSON.parse(text);
  const nodeFields = snapshot.meta.node_fields;
  const edgeFields = snapshot.meta.edge_fields;
  const nodeTypes = snapshot.meta.node_types[0];
  const edgeTypes = snapshot.meta.edge_types[0];
  const [typeAt, edgeCountAt] = [nodeFields.indexOf('type'), nodeFields.indexOf('edge_count')];
  const [edgeTypeAt, edgeNameAt, edgeToAt] = [edgeFields.indexOf('type'), edgeFields.indexOf('name_or_index'), edgeFields.indexOf('to_node')];

  let stringCount = 0;
  const bigArrays = [];
  let edge = 0;
  for (let node = 0; node < nodes.length; node += nodeFields.length) {
    const type = nodeTypes[nodes[node + typeAt]];
    if (type.includes('string')) stringCount += 1;
    for (let k = 0; k < nodes[node + edgeCountAt]; k++, edge += edgeFields.length) {
      if (edgeTypes[edges[edge + edgeTypeAt]] !== 'property') continue;
      const target = edges[edge + edgeToAt];
      // An Array object points to its element store; count the elements of that store.
      if (nodeTypes[nodes[target + typeAt]] !== 'object') continue;
      const elements = nodes[target + edgeCountAt];
      if (elements > 1000) bigArrays.push({ property: strings[edges[edge + edgeNameAt]], edges: elements });
    }
  }
  return { stringCount, bigArrays, megabytes: text.length / 1024 / 1024 };
}
