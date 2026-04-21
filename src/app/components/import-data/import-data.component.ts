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
    mappedColumnArray = signal<[string, string][]>([]);
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

    constructor(private pouchdb: PouchdbService) {
        effect(() => {
            const _ = this.pouchdb.dbUpdated();
        });
        this.mappedColumnArray.set(Object.entries(this.mappedColumns));
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
            let columns = Object.keys(data[0] as object);
            this.selections = {};
            columns.forEach(c => this.selections[c] = this.tryMapColumn(c));
            this.columns.set(columns);
        }

        this.autoMapped.set(Object.values(this.selections).some(v => v !== ""));
        this.cantUpload.set(new Set(Object.values(this.selections).filter(v => v !== "")).size < 8);
        this.uploadedSuccessfully.set(null);
        this.mapPosters();
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

    onSelectionChanged(e: Event, column: string) {
        this.selections[column] = (e.target as HTMLSelectElement).value;
        this.cantUpload.set(new Set(Object.values(this.selections).filter(v => v !== "")).size < 8);
        this.mapPosters();
    }

    mapPosters() {
        this.dataTable.set(this.data().map(p => Object.values(p)).slice(0, 3));
        this.currentPosters.set(this.data().map(row => {
            const newRow: any = {};
            Object.keys(row).filter(k => this.selections[k] !== "").forEach(k => newRow[this.selections[k]] = row[k]);
            return newRow;
        }));
        this.currentPostersTable.set(this.currentPosters().map(p => Object.values(p)).slice(0, 3));
    }

    async uploadData() {
        this.mapPosters();
        this.uploadedSuccessfully.set(await this.pouchdb.setPosters(this.currentPosters(), this.overwrite));
    }
}
