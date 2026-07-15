#!/usr/bin/env swift

import ApplicationServices
import Foundation

guard CommandLine.arguments.count == 4,
      let pid = pid_t(CommandLine.arguments[1]) else {
    fputs("usage: ax-press.swift <pid> <AXRole> <accessible-name>\n", stderr)
    exit(64)
}

let wantedRole = CommandLine.arguments[2]
let wantedName = CommandLine.arguments[3]
let app = AXUIElementCreateApplication(pid)

func stringAttribute(_ element: AXUIElement, _ attribute: String) -> String? {
    var value: CFTypeRef?
    guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success else {
        return nil
    }
    return value as? String
}

func children(_ element: AXUIElement) -> [AXUIElement] {
    var value: CFTypeRef?
    guard AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &value) == .success else {
        return []
    }
    return value as? [AXUIElement] ?? []
}

func pressFirstMatch(_ element: AXUIElement) -> Bool {
    let role = stringAttribute(element, kAXRoleAttribute)
    let name = stringAttribute(element, kAXTitleAttribute)
        ?? stringAttribute(element, kAXDescriptionAttribute)

    if role == wantedRole, name == wantedName {
        let result = AXUIElementPerformAction(element, kAXPressAction as CFString)
        guard result == .success else {
            fputs("AXPress failed with code \(result.rawValue)\n", stderr)
            exit(1)
        }
        return true
    }

    for child in children(element) where pressFirstMatch(child) {
        return true
    }
    return false
}

guard pressFirstMatch(app) else {
    fputs("element not found: role=\(wantedRole) name=\(wantedName)\n", stderr)
    exit(2)
}

print("pressed role=\(wantedRole) name=\(wantedName) pid=\(pid)")
