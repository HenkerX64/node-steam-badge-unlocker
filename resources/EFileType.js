/**
 * @typedef {'screenshots'|'videos'|'images'|'workshop'|'guides'} EFileTypeType
 * @enum EFileType
 */
module.exports = {
	"workshop": 2,
	"images": 3,
	"videos": 4,
	"screenshots": 5,
	"guides": 9,

	// Value-to-name mapping for convenience
	"2": "workshop",
	"3": "images",
	"4": "videos",
	"5": "screenshots",
	"9": "guides",
};
