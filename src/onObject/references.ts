import powerbi from "powerbi-visuals-api";
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;

import { IFontReference, ILegendReference } from "./interfaces";
import { TornadoObjectNames } from "../TornadoChartSettingsModel";

export const TitleEdit: SubSelectableDirectEdit = {
    reference: {
        objectName: TornadoObjectNames.Legend,
        propertyName: "titleText"
    },
    style: SubSelectableDirectEditStyle.HorizontalLeft,
}

export const titleEditSubSelection = JSON.stringify(TitleEdit);

const createBaseFontReference = (objectName: string, settingName: string = ""): IFontReference => {
    return {
        fontFamily: {
            objectName: objectName,
            propertyName: "fontFamily" + settingName
        },
        bold: {
            objectName: objectName,
            propertyName: "fontBold" + settingName
        },
        italic: {
            objectName: objectName,
            propertyName: "fontItalic" + settingName
        },
        underline: {
            objectName: objectName,
            propertyName: "fontUnderline" + settingName
        },
        fontSize: {
            objectName: objectName,
            propertyName: "fontSize" + settingName
        },
        color: {
            objectName: objectName,
            propertyName: "labelColor"
        }
    }
}

export const legendReferences: ILegendReference = {
    ...createBaseFontReference(TornadoObjectNames.Legend),
    cardUid: "Visual-legend-card",
    groupUid: "legendOptions-group",
    show: {
        objectName: TornadoObjectNames.Legend,
        propertyName: "show"
    },
    showTitle: {
        objectName: TornadoObjectNames.Legend,
        propertyName: "showTitle"
    },
    titleText: {
        objectName: TornadoObjectNames.Legend,
        propertyName: "titleText"
    },
    position: {
        objectName: TornadoObjectNames.Legend,
        propertyName: "position"
    }
}
