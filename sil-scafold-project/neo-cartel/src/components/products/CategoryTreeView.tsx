import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CategoryTree } from '@/hooks/use-categories';

interface CategoryTreeViewProps {
  categories: CategoryTree[];
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number) => void;
}

export const CategoryTreeView: React.FC<CategoryTreeViewProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: CategoryTree) => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;
    const hasChildren = category.children.length > 0;

    return (
      <div key={category.id} className="category-item">
        <div 
          className={`flex items-center py-1 px-2 hover:bg-gray-100 rounded-md cursor-pointer ${
            isSelected ? 'bg-gray-100 font-medium' : ''
          }`}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 mr-1"
              onClick={() => toggleCategory(category.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <span className="w-6 mr-1"></span>
          )}
          
          <div 
            className="flex items-center flex-1 py-1"
            onClick={() => onSelectCategory(category.id)}
          >
            {hasChildren ? (
              <Folder className="h-4 w-4 mr-2 text-blue-500" />
            ) : (
              <Package className="h-4 w-4 mr-2 text-green-500" />
            )}
            <span>{category.name}</span>
          </div>
          
          <Badge variant="outline" className="ml-2">
            {category.product_count}
          </Badge>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="pl-6 mt-1 border-l border-gray-200 ml-3">
            {category.children.map(child => renderCategory(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="category-tree border rounded-lg p-4 bg-white">
      <h2 className="text-lg font-semibold mb-4">Categories</h2>
      <div>
        {categories.map(category => renderCategory(category))}
      </div>
    </div>
  );
};