/**
 * Represents a probability distribution.
 */
type Distribution = BinomialDistribution;

/**
 * Represents a binomial distribution.
 */
interface BinomialDistribution {
	type: "binomial";
	n: number;
	p: number;
}