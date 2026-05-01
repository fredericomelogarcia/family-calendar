"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, PencilSimple, Plus, Tag, Trash, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";

interface Category {
  id: string;
  name: string;
  color: string;
}

const COLORS = ["#7C9A7E", "#D76D57", "#D9903D", "#4F83C2", "#8B5CF6", "#C75A9A", "#159A73", "#5B61B2"];

export function BudgetCategorySettings() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error loading expense categories:", error);
      showToast("error", "Could not load expense categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setColor(COLORS[0]);
    setShowForm(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setColor(COLORS[0]);
    setShowForm(true);
  };

  const openEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setColor(category.color || COLORS[0]);
    setShowForm(true);
  };

  const saveCategory = async () => {
    if (!name.trim()) {
      showToast("error", "Category name is required");
      return;
    }

    try {
      const res = await fetch("/api/categories", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name,
          color,
          budgetAmount: null,
          budgetPeriod: "monthly",
        }),
      });

      if (!res.ok) throw new Error("Failed");
      showToast("success", editingId ? "Category updated" : "Category added");
      resetForm();
      fetchCategories();
    } catch {
      showToast("error", "Could not save category");
    }
  };

  const addDefaultCategories = async () => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaults: true }),
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      showToast("success", data.created > 0 ? `${data.created} categories added` : "Default categories already exist");
      fetchCategories();
    } catch {
      showToast("error", "Could not add default categories");
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast("success", "Category deleted");
      fetchCategories();
    } catch {
      showToast("error", "Could not delete category");
    }
  };

  return (
    <section className="bg-surface rounded-[--radius-md] border border-border p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary font-[family-name:var(--font-heading)]">Expense Categories</h3>
          <p className="text-text-secondary mt-1">Manage the simple category names used to label expenses.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={addDefaultCategories}>Add Defaults</Button>
          <Button onClick={openCreate} leftIcon={<Plus size={18} />}>Add Category</Button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-[--radius-md] bg-surface-alt p-4 space-y-4">
          <div className="grid gap-4">
            <Input label="Category name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Groceries" />
          </div>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((item) => (
              <button
                key={item}
                onClick={() => setColor(item)}
                className={`h-9 w-9 rounded-full ${color === item ? "ring-2 ring-primary ring-offset-2" : ""}`}
                style={{ backgroundColor: item }}
                aria-label={`Use category colour ${item}`}
                type="button"
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveCategory} leftIcon={<Check size={16} />}>Save</Button>
            <Button size="sm" variant="secondary" onClick={resetForm} leftIcon={<X size={16} />}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-32 rounded-[--radius-md] bg-surface-alt animate-pulse" />
      ) : categories.length === 0 ? (
        <div className="rounded-[--radius-md] bg-surface-alt p-6 text-center">
          <Tag size={28} className="mx-auto text-text-tertiary mb-2" />
          <p className="font-medium text-text-primary">No expense categories yet</p>
          <p className="text-sm text-text-secondary mt-1">Use defaults for a strong starting point, then rename anything you need.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {categories.map((category) => (
            <div key={category.id} className="rounded-[--radius-md] border border-border p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                  <p className="font-medium text-text-primary truncate">{category.name}</p>
                </div>
                <p className="text-sm text-text-secondary mt-1">Used to label expenses</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(category)} className="p-2 text-text-tertiary hover:text-primary" aria-label={`Edit ${category.name}`}><PencilSimple size={16} /></button>
                <button onClick={() => deleteCategory(category.id)} className="p-2 text-text-tertiary hover:text-error-dark" aria-label={`Delete ${category.name}`}><Trash size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
