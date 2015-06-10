'use strict';
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    phone: DataTypes.STRING,
    time: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
        this.hasMany(models.Message, { foreignKey: 'user_id' });
      }
    }
  });
  return User;
};