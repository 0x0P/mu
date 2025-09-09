import { Controller, Method, Payload, Inject, Context } from "@/index.ts";
import { Logger } from "@/index.ts";

@Controller("room")
export class RoomController {
  private readonly logger = new Logger("RoomController");
  private static rooms = new Map<string, Set<string>>();

  @Method("join")
  join(@Context() ctx: any, @Payload() p: { room?: string }) {
    const room = p?.room || "lobby";
    const id = ctx?.connectionId;
    if (!id) return { success: false, error: "no ctx" };
    if (!RoomController.rooms.has(room))
      RoomController.rooms.set(room, new Set());
    RoomController.rooms.get(room)!.add(id);
    this.logger.log(`join ${room} <- ${id}`);
    return { success: true, data: { room, id } };
  }

  @Method("leave")
  leave(@Context() ctx: any, @Payload() p: { room?: string }) {
    const room = p?.room || "lobby";
    const id = ctx?.connectionId;
    RoomController.rooms.get(room)?.delete(id);
    this.logger.log(`leave ${room} <- ${id}`);
    return { success: true };
  }

  @Method("members")
  members(@Payload() p: { room?: string }) {
    const room = p?.room || "lobby";
    return { data: Array.from(RoomController.rooms.get(room) ?? []) };
  }
}
