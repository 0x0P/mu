import { Controller, Method, Payload, Message, Inject } from "@/index.ts";
import { CatsService } from "./cats.service.ts";

@Controller("cats")
export class CatsController {
  constructor(@Inject(CatsService) private readonly cats: CatsService) {}

  @Method("list")
  list() {
    return { data: this.cats.list() };
  }

  @Method("create")
  create(@Payload() payload: { name: string; age: number }) {
    const { name, age } = payload || ({} as any);
    if (!name || typeof age !== "number") {
      return { success: false, error: "name and age are required" };
    }
    const cat = this.cats.create(name, age);
    return { data: cat };
  }

  @Method("remove")
  remove(@Payload() payload: { id: string }) {
    const id = payload?.id;
    if (!id) return { success: false, error: "id is required" };
    const ok = this.cats.remove(id);
    return ok ? { success: true } : { success: false, error: "not found" };
  }
}
