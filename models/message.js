'use strict';
module.exports = function(sequelize, DataTypes) {
  var Message = sequelize.define('Message', {
    text_body: DataTypes.TEXT,
    user_id: DataTypes.INTEGER,
    sent: DataTypes.BOOLEAN,
    time: DataTypes.INTEGER,
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
        this.belongsTo(models.User, { foreignKey: 'user_id' });
      }
    }
  });
  return Message;
};


