function Lexi() {
	this.rules = [];
	this.lastRulePosition = 0;
}

Lexi.prototype.addRule = function(pattern, onMatch) {
	this.lastRulePosition++;
	var rule = new Rule(pattern, this.lastRulePosition, onMatch);
	this.lastRulePosition += rule.subStringCount;
	this.rules.push(rule);

	return this;
};

Lexi.prototype.scan = function(input) {
	var regexp = this.getRegexp(), matches, tokens = [], offset = 0, line = 1, error = false;

	while(!error && (matches = regexp.exec(input))) {
		for(var i = 0; i < this.rules.length; i++) {
			if(matches[this.rules[i].startPosition] !== undefined) {
				var rule = this.rules[i], whole = matches[this.rules[i].startPosition], values = rule.subStringCount > 0 ? [] : [whole];
				if(whole !== input.substring(0, whole.length)) {
					error = true;
					break;
				}

				for(var n = 0; n < rule.subStringCount; n++) {
					values.push(matches[rule.getSubStringPosition(n)]);
				}

				var types = rule.onMatch.apply(null, values);
				types = types instanceof Array ? types : [types];

				for(var n = 0; n < types.length; n++) {
					if(types[n] !== undefined) {
						tokens.push(new Lexeme(types[n], values[n], offset, line));
					}

					offset += values[n].length;
					line += (values[n].match(new RegExp("\\n", 'g')) || []).length;
				}

				input = input.substring(whole.length);
				break;
			}
		}
	}

	if(error || input !== '') {
		throw new Error('Invalid token at ' + input + '!', 'Invalid Token'); // @todo Custom exception
	}

	return tokens;
};

Lexi.prototype.getRegexp = function() {
	return new RegExp('(' + this.rules.join(')|(') + ')');
};

function Rule(pattern, position, onMatch) {
	this.startPosition = position;
	var subStringCount = 0;
	this.pattern = pattern.replace(new RegExp('([^(])?\\(', 'g'), function(pattern, escaped) {
		if(escaped !== '\\') {
			subStringCount++;
		}

		return escaped === undefined ? '(' : escaped + '(';
	});

	this.subStringCount = subStringCount;
	this.onMatch = (onMatch || function() {
		return undefined;
	});
}

Rule.prototype.getSubStringPosition = function(n) {
	return n >= 0 && n < this.subStringCount ? this.startPosition + n + 1 : undefined;
};

Rule.prototype.toString = function() {
	return this.pattern;
};

function Lexeme(type, values, offset, line) {
	this.type = type;
	this.values = values;
	this.offset = offset;
	this.line = line;
}

module.exports = Lexi;