import { Observable } from "rxjs";

type ListenerOpts<T> = {
  slice: Observable<T>
};
