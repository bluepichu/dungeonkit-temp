declare namespace PIXI {
	interface MultiTextStyle extends PIXI.TextStyle {
		valign?: "top" | "middle" | "bottom";
	}

	class MultiStyleText extends PIXI.Text {
		constructor(text: String, textStyles: { [key: string]: PIXI.MultiTextStyle })
	}
}