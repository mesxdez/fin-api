const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Content = sequelize.define(
  "Content",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    textHtml: {
      type: DataTypes.TEXT("MEDIUM"),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    banner: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 500],
      },
    },
    status: {
      type: DataTypes.ENUM("Draft", "Published", "Archived"),
      allowNull: false,
      defaultValue: "Draft",
      validate: {
        isIn: [["Draft", "Published", "Archived"]],
      },
    },
    createdBy: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    updatedBy: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
  },
  {
    tableName: "contents",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    indexes: [
      {
        fields: ["status"],
      },
      {
        fields: ["createdAt"],
      },
      {
        fields: ["title"],
      },
    ],
    getterMethods: {
      createdDate() {
        return this.createdAt
          ? this.createdAt.toISOString().slice(0, 10)
          : null;
      },
      updatedDate() {
        return this.updatedAt
          ? this.updatedAt.toISOString().slice(0, 10)
          : null;
      },
    },
  }
);

module.exports = Content;
