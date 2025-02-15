// https://gjs.guide/guides/gobject/subclassing.html#subclassing-gobject

@register({ GTypeName: "MyObj" })
class MyObj extends GObject.Object {
  @property(String)
  declare propName: string // default getter/setter with notify signals

  @property(Number)
  get customProp() {
    return "value"
  }

  // defining custom setters requiers manual notify emission
  set customProp(v: number) {
    if (v !== this.customProp) {
      this.notify("custom-prop")
    }
  }

  @signal(Number, String)
  declare someSigh: (a: number, b: string) => void

  @signal(Number, String)
  defHandler(a: number, b: string) {
    print("default handler", a, b)
  }
}

// import GObject from 'gi://GObject';
//
// const SubclassExample = GObject.registerClass({
//   GTypeName: 'SubclassExample',
//   Properties: {
//     'example-property': GObject.ParamSpec.boolean(
//       'example-property',
//       'Example Property',
//       'A read-write boolean property',
//       GObject.ParamFlags.READWRITE,
//       true
//     ),
//   },
//   Signals: {
//     'example-signal': {},
//   },
// }, class SubclassExample extends GObject.Object {
//     constructor(constructProperties = {}) {
//       super(constructProperties);
//     }
//
//     get example_property() {
//       if (this._example_property === undefined)
//       this._example_property = null;
//
//       return this._example_property;
//     }
//
//     set example_property(value) {
//       if (this.example_property === value)
//       return;
//
//       this._example_property = value;
//       this.notify('example-property');
//     }
//   });
