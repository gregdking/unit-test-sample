define(function () {
    var Meridium = {};

    Meridium.inherit = function (base, inherited) {
        function __() { this.constructor = inherited; }
        __.prototype = base.prototype;
        inherited.prototype = new __();
        return base;
    };

    Meridium.createEnum = function createEnum(values) {
        /// <summary>
        ///     Creates an enum object that can be accessed as either an indexed array
        ///     or as an associative array. 
        /// </summary>
        /// <param name="values" type="object">
        ///     An object containing all enum values and their display text such as
        ///     { red: 'Red', blue: 'Blue', lightBlue: 'Light Blue' }
        /// </param>
        /// <returns>The enumeration object.</returns>

        var enumeration = [];

        var i = 0;
        _.each(values, function (value, key, list) {
            var enumVal = {
                id: i,
                name: key,
                text: value
            };
            enumeration[key] = enumVal;
            enumeration.push(enumVal);
            i++;
        });


        enumeration.parse = function (val) {
            if (!isNaN(val)) {
                return enumeration[val];
            }
            else {
                var enumValue;

                _.each(enumeration, function (value) {
                    if (val === value) enumValue = val;
                });

                if (!enumValue) {
                    _.each(values, function (value, key, list) {
                        if (val === value || val === key) enumValue = enumeration[key];
                    });
                }
                return enumValue;
            }
        };

        enumeration.getDisplayText = function (val) {
            var enumVal = enumeration.parse(val);
            if (enumVal)
                return enumVal.text;
            else
                return '';
        };

        Object.freeze(enumeration);
        return enumeration;
    }

    return Meridium;
});
