declare module 'react/jsx-runtime' {
  import * as React from 'react'
  export { Fragment } from 'react'

  export namespace JSX {
    type ElementType = string | React.JSXElementConstructor<any>
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode
    }
    interface ElementAttributesProperty {
      props: {}
    }
    interface ElementChildrenAttribute {
      children: {}
    }
    type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>
    interface IntrinsicAttributes extends React.Attributes {}
    interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> {}
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }

  export function jsx(
    type: React.ElementType,
    props: unknown,
    key?: React.Key,
  ): React.ReactElement

  export function jsxs(
    type: React.ElementType,
    props: unknown,
    key?: React.Key,
  ): React.ReactElement
}

declare module 'react/jsx-dev-runtime' {
  import * as React from 'react'
  export { Fragment } from 'react'

  export namespace JSX {
    type ElementType = string | React.JSXElementConstructor<any>
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode
    }
    interface ElementAttributesProperty {
      props: {}
    }
    interface ElementChildrenAttribute {
      children: {}
    }
    type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>
    interface IntrinsicAttributes extends React.Attributes {}
    interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> {}
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }

  export interface JSXSource {
    fileName?: string | undefined
    lineNumber?: number | undefined
    columnNumber?: number | undefined
  }

  export function jsxDEV(
    type: React.ElementType,
    props: unknown,
    key: React.Key | undefined,
    isStatic: boolean,
    source?: JSXSource,
    self?: unknown,
  ): React.ReactElement
}
