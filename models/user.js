'use strict';
module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define('User', {
        user_id: DataTypes.STRING,
        password: DataTypes.STRING
    }, {
        classMethods: {
            associate: function(models) {
                // associations can be defined here
            }
        }
    });
    return User;
};
