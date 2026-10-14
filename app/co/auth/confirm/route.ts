import {NextRequest,NextResponse} from "next/server";
export async function GET(request:NextRequest){return NextResponse.redirect(new URL("/co/auth?message=Use%20your%20Neon%20Auth%20email%20verification%20link",request.url));}
