import { Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PouchdbService } from '../../services/pouchdb.service';
import Papa from 'papaparse';

@Component({
    selector: 'app-import-data',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './import-data.component.html',
    styleUrls: ['./import-data.component.scss']
})
export class ImportDataComponent {
    fileName = signal<string | null>(null);
    file = signal<string>("");
    data = signal<any[]>([]);
    dataTable = signal<any[]>([]);
    columns = signal<string[]>([]);
    cantUpload = signal<boolean>(true);
    autoMapped = signal<boolean>(false);
    uploadedSuccessfully = signal<boolean | null>(null);
    currentPosters = signal<any[]>([]);
    currentPostersTable = signal<any[]>([]);
    mappedColumnArray = signal<[keyof typeof this.mappedColumns, string][]>([]);
    selections: any = {};
    overwrite: boolean = false;
    mappedColumns = {
        "id": "Poster ID #",
        "email": "Student Email",
        "group": "Poster Title",
        "subject": "Subject(s)",
        "students": "Student Name(s)",
        "advisor": "Faculty Supervisor Name(s)",
        "advisorEmail": "Primary Faculty Supervisor Email",
        "Judged?": "Judge Poster?"
    } as const;
    columnTooltips = {
        "id": "The poster's ID number.",
        "email": "The primary student email for the poster.",
        "group": "The title of the poster.",
        "subject": "The subject(s) of the poster (e.g., Information Technology, Chemistry, etc.)",
        "students": "The names of the students for the poster.",
        "advisor": "The names of the faculty advisors for the poster.",
        "advisorEmail": "The primary faculty advisor email for the poster.",
        "Judged?": "Whether the poster should be judged."
    } as const;

    constructor(private pouchdb: PouchdbService) {
        effect(() => void this.pouchdb.dbUpdated());
        this.mappedColumnArray.set(Object.entries(this.mappedColumns) as [keyof typeof this.mappedColumns, string][]);
    }

    async onFileSelected(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];

        if (!file) {
            return;
        }

        this.fileName.set(file.name);
        const fileText = await file.text();
        this.file.set(fileText);
        const { data } = Papa.parse(fileText, { header: true });
        this.data.set(data);

        if (data.length > 0) {
            const columns = Object.keys(data[0] as object);
            this.selections = {};
            Object.keys(this.mappedColumns).forEach(c => this.selections[c] = columns.find(d => this.tryMapColumn(d) === c) ?? "");
            this.columns.set(columns);
        }

        this.autoMapped.set(Object.values(this.selections).some(v => v !== ""));
        this.updateMapping();
        this.uploadedSuccessfully.set(null);
    }

    tryMapColumn(column: string) {
        const c = column.toLowerCase();
        if (c.includes("title")) return "group";
        if (c.includes("poster") && (c.includes("#") || c.includes("number") || c.match(/\bid\b/) || c.match(/\bno\.?\b/))) return "id";
        if (c.includes("faculty") && c.includes("email")) return "advisorEmail";
        if (c.includes("faculty")) return "advisor";
        if (c.includes("email")) return "email";
        if (c.includes("student")) return "students";
        if (c.includes("discipline") || c.includes("subject")) return "subject";
        if (c.includes("judged")) return "Judged?";
        return "";
    }

    updateMapping() {
        this.cantUpload.set(Object.values(this.selections).some(s => s === ""));
        this.mapPosters();
    }

    onSelectionChanged(e: Event, column: string) {
        this.selections[column] = (e.target as HTMLSelectElement).value;
        this.updateMapping();
    }

    mapPosters() {
        this.dataTable.set(this.data().map(p => Object.values(p)).slice(0, 3));
        this.currentPosters.set(this.data().map(row => {
            const newRow: any = {};
            Object.keys(this.mappedColumns).filter(k => this.selections[k] !== "").forEach(k => newRow[k] = row[this.selections[k]]);
            return newRow;
        }));
        this.currentPostersTable.set(this.currentPosters().map(p => Object.values(p)).slice(0, 3));
    }

    async uploadData() {
        this.mapPosters();
        this.uploadedSuccessfully.set(await this.pouchdb.setPosters(this.currentPosters(), this.overwrite));
    }
}
