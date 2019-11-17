# App icons

* Authors: Geoff Jacobsen, Russell Healy
* Copyright: 2013-2019 Vimaly Software Limited (NZ)
* License: Private + assorted. See docs/licenses

### Description

Icons for use within Koru applications

### Install

```sh
npm i
./install.sh
```

### Adding icons

Icons should contain one path only and be compatible with Google's
Material Icons. Use an existing icon as a template.

Name the icon like: `clown-face.svg`

### Using

Set font-family to "App icons" and content to icon name (change '-'s to '_'s).

like

```html
<button icon="clown_face"></button>
```

```css
[icon]:before {
   font-family: "App icons";
   content: attr(icon);
}
```
