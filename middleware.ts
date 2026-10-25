import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files, images and the 3D model assets.
  matcher: ["/((?!_next/static|_next/image|models/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb|json)$).*)"],
};
