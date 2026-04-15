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
    file = signal<string>("");
    data = signal<any[]>([]);
    columns = signal<string[]>([]);
    cantUpload = signal<boolean>(true);
    autoMapped = signal<boolean>(false);
    uploadedSuccessfully = signal<boolean | null>(null);
    selections: any = {};

    constructor(private pouchdb: PouchdbService) {
        effect(() => {
            const _ = this.pouchdb.dbUpdated();
        });
    }

    async onFileSelected(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];

        if (!file) {
            return;
        }

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
    }

    async uploadData() {
        const posters = this.data().map(row => {
            const newRow: any = {};
            Object.keys(row).filter(k => this.selections[k] !== "").forEach(k => newRow[this.selections[k]] = row[k]);
            return newRow;
        });

        this.uploadedSuccessfully.set(await this.pouchdb.setPosters(posters));
    }
}
