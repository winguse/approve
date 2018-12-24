declare module "*.vue" {
  import Vue from "vue";
  export default Vue;
}

declare module "quasar"

interface Array<T> {
  flatMap<E>(callback: (t: T) => Array<E>): Array<E>
}
