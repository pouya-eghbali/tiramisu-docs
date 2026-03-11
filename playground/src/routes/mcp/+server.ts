import { handleMcpRequest } from "@tiramisu-docs/kit/mcp"
import { docs, searchIndex, sidebar } from "virtual:tiramisu-docs"

export async function POST({ request }) {
  const body = await request.json()
  const result = handleMcpRequest(body, { docs, searchIndex, sidebar })
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  })
}
