import { Injectable } from "@/index.ts";

export interface Cat {
  id: string;
  name: string;
  age: number;
}

let nextId = 1;

@Injectable()
export class CatsService {
  private cats: Cat[] = [];

  list(): Cat[] {
    return [...this.cats];
  }

  create(name: string, age: number): Cat {
    const cat: Cat = { id: String(nextId++), name, age };
    this.cats.push(cat);
    return cat;
  }

  remove(id: string): boolean {
    const idx = this.cats.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.cats.splice(idx, 1);
    return true;
  }
}
