/**
 * An attack.
 */
interface Attack {
	name: string;
	animation: string;
	description: string;
	target: TargetSelector;
	accuracy: number | "always";
	power?: number;
	uses: MaxCurrentStat;
	onHit: SecondaryEffect[];
	// onMiss
}

/**
 * Describes the enemies targeted by an attack.
 */
type TargetSelector = RoomTargetSelector | FrontTargetSelector | SelfTargetSelector | TeamTargetSelector;

/**
 * A target selector that selects entities in the same room as the attacker.
 */
interface RoomTargetSelector {
	type: "room";
	includeSelf: boolean;
	includeAllies: boolean;
}

/**
 * A target selector that selects a target directly in front of the attacker.
 */
interface FrontTargetSelector {
	type: "front";
	includeAllies: boolean;
	cutsCorners?: boolean;
}

/**
 * A target selector that selects the attacker itself.
 */
interface SelfTargetSelector {
	type: "self";
}

/**
 * A target selector that selects members of the attacker's team.
 */
interface TeamTargetSelector {
	type: "team";
	includeSelf: boolean;
}

/**
 * Describes an effect other than damage caused by an attack.
 */
type SecondaryEffect = SecondaryStatEffect;

/**
 * A secondary effect that affects a stat.
 */
interface SecondaryStatEffect {
	type: "stat";
	stat: string;
	amount: number;
}