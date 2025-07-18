"use strict";
/**
 * Template AST interfaces for structured template representation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateNodeType = void 0;
exports.isRootNode = isRootNode;
exports.isTextNode = isTextNode;
exports.isVariableNode = isVariableNode;
exports.isEachNode = isEachNode;
exports.isIfNode = isIfNode;
exports.isHelperNode = isHelperNode;
exports.isCommentNode = isCommentNode;
exports.createRootNode = createRootNode;
exports.createTextNode = createTextNode;
exports.createVariableNode = createVariableNode;
exports.createEachNode = createEachNode;
exports.createIfNode = createIfNode;
exports.createHelperNode = createHelperNode;
exports.createCommentNode = createCommentNode;
exports.createTemplateAST = createTemplateAST;
/**
 * Types of template nodes
 */
var TemplateNodeType;
(function (TemplateNodeType) {
    TemplateNodeType["ROOT"] = "root";
    TemplateNodeType["TEXT"] = "text";
    TemplateNodeType["VARIABLE"] = "variable";
    TemplateNodeType["EACH"] = "each";
    TemplateNodeType["IF"] = "if";
    TemplateNodeType["HELPER"] = "helper";
    TemplateNodeType["COMMENT"] = "comment";
})(TemplateNodeType || (exports.TemplateNodeType = TemplateNodeType = {}));
/**
 * Type guard for RootNode
 */
function isRootNode(node) {
    return node.type === TemplateNodeType.ROOT;
}
/**
 * Type guard for TextNode
 */
function isTextNode(node) {
    return node.type === TemplateNodeType.TEXT;
}
/**
 * Type guard for VariableNode
 */
function isVariableNode(node) {
    return node.type === TemplateNodeType.VARIABLE;
}
/**
 * Type guard for EachNode
 */
function isEachNode(node) {
    return node.type === TemplateNodeType.EACH;
}
/**
 * Type guard for IfNode
 */
function isIfNode(node) {
    return node.type === TemplateNodeType.IF;
}
/**
 * Type guard for HelperNode
 */
function isHelperNode(node) {
    return node.type === TemplateNodeType.HELPER;
}
/**
 * Type guard for CommentNode
 */
function isCommentNode(node) {
    return node.type === TemplateNodeType.COMMENT;
}
/**
 * Create a root node
 */
function createRootNode(children = []) {
    return {
        type: TemplateNodeType.ROOT,
        children
    };
}
/**
 * Create a text node
 */
function createTextNode(content, location) {
    return {
        type: TemplateNodeType.TEXT,
        content,
        location
    };
}
/**
 * Create a variable node
 */
function createVariableNode(path, original, location) {
    return {
        type: TemplateNodeType.VARIABLE,
        path,
        original,
        location
    };
}
/**
 * Create an each node
 */
function createEachNode(items, children = [], original, item, index, location) {
    return {
        type: TemplateNodeType.EACH,
        items,
        item,
        index,
        children,
        original,
        location
    };
}
/**
 * Create an if node
 */
function createIfNode(condition, children = [], original, elseChildren, location) {
    return {
        type: TemplateNodeType.IF,
        condition,
        children,
        else: elseChildren,
        original,
        location
    };
}
/**
 * Create a helper node
 */
function createHelperNode(name, args = [], original, children, location) {
    return {
        type: TemplateNodeType.HELPER,
        name,
        args,
        children,
        original,
        location
    };
}
/**
 * Create a comment node
 */
function createCommentNode(content, original, location) {
    return {
        type: TemplateNodeType.COMMENT,
        content,
        original,
        location
    };
}
/**
 * Create a template AST
 */
function createTemplateAST(children = [], source = '') {
    return {
        type: TemplateNodeType.ROOT,
        children,
        source
    };
}
//# sourceMappingURL=TemplateAST.js.map