export interface VmContent {
  props: any;
  data: () => void;
  dataOptions: any;
  computed: any;
  watch: any;
  methods: any;
  filters: any;
  hooks: any;
  emits: string[];
  refs: string[];
  use: any;
  import: any;
}

export interface VmKeys {
  props: string[];
  data: string[];
  computed: string[];
  watch: string[];
  methods: string[];
  filters: string[];
  hooks: string[];
  use: () => Array<string[]>;
  import: () => Array<string[]>;
}

export interface IDataSource {
  key: string;
  type: string;
}

export interface VmOutput {
  import: string;
  use: string;
  props: string;
  emits: string;
  refs: string;
  data: string;
  dataSource?: Array<IDataSource>;
  computed: string;
  watch: string;
  hooks: string;
  methods: string;
  filters: string;
}

export interface VmSetContentMethods {
  props: () => void;
  data: () => void;
  computed: () => void;
  watch: () => void;
  hooks: () => void;
  methods: () => void;
  filters: () => void;
  emits: () => void;
  refs: () => void;
  use: () => void;
  import: () => void;
  output: () => void;
}

export interface UtilsMethods {
  getContentStr: (a: any, b?: any, c?: any) => any;
  replaceKey: (a: string, bol?: boolean) => any;
  replaceValue: (a: string, bol: boolean) => any;
  addImport: (vuex: string, useStore: string) => void;
  addUse: (store: string) => void;
}
